import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Coordinator, {
  ConnectionStrategy, LogTruncationStrategy, RequestStrategy, SyncStrategy
} from '@orbit/coordinator';
import { Exception } from '@orbit/core';
import {
  buildQuery, ClientError, FindRecord, FindRecordsTerm, NetworkError, Operation, Query, QueryOrExpression, Record,
  RecordIdentity, ReplaceRecordOperation, Schema, SchemaSettings, Transform, TransformOrOperations
} from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import Store from '@orbit/store';
import { Dict } from '@orbit/utils';
import { OAuthService } from 'angular-oauth2-oidc';
import { ObjectId } from 'bson';
import dcopy from 'deep-copy';
import { fromEventPattern, merge, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JSONAPIService {
  private static readonly STORE = 'store';
  private static readonly REMOTE = 'remote';
  private static readonly BACKUP = 'backup';
  private static readonly RETRY_TIMEOUT = 5000;

  private schema: Schema;
  private bucket: IndexedDBBucket;
  private store: Store;
  private remote: JSONAPISource;
  private backup: IndexedDBSource;
  private coordinator: Coordinator;

  constructor(private readonly oauthService: OAuthService, private readonly http: HttpClient) { }

  async init(): Promise<void> {
    const schemaDef = await this.http.get<SchemaSettings>('api/schema',
      { headers: { 'Content-Type': 'application/json' } }).toPromise();
    schemaDef.generateId = () => new ObjectId().toHexString();
    this.schema = new Schema(schemaDef);

    this.bucket = new IndexedDBBucket({
      namespace: 'xforge-state'
    });

    this.store = new Store({
      schema: this.schema,
      bucket: this.bucket
    });

    this.remote = new JSONAPISource({
      schema: this.schema,
      bucket: this.bucket,
      name: JSONAPIService.REMOTE,
      host: window.location.origin,
      namespace: 'api'
    });

    this.backup = new IndexedDBSource({
      schema: this.schema,
      bucket: this.bucket,
      name: JSONAPIService.BACKUP,
      namespace: 'xforge'
    });

    this.coordinator = new Coordinator({
      sources: [this.store, this.remote, this.backup],
      strategies: [
        // Purge a deleted resource from the cache when get() is called on it
        new RequestStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pullFail',

          action: (q: Query, e: Exception) => this.purgeDeletedResource(q, e),

          blocking: true
        }),
        // Purge deleted resources from the cache when getAll() is called
        new ConnectionStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pull',

          action: (q: Query, t: Transform[]) => this.purgeDeletedResources(q, t),
          filter: (q: Query) => q.expression.op === 'findRecords'
        }),
        // Retry sending updates to server when push fails
        new RequestStrategy({
          source: JSONAPIService.REMOTE,
          on: 'pushFail',

          action: (t: Transform, e: Exception) => this.handleFailedPush(t, e),

          blocking: true
        }),
        // Query the remote server whenever the store is queried
        new RequestStrategy({
          source: JSONAPIService.STORE,
          on: 'beforeQuery',

          target: JSONAPIService.REMOTE,
          action: 'pull',

          blocking: false,

          catch: (e: Exception) => {
            this.store.requestQueue.skip();
            this.remote.requestQueue.skip();
            throw e;
          }
        }),
        // Update the remote server whenever the store is updated
        new RequestStrategy({
          source: JSONAPIService.STORE,
          on: 'beforeUpdate',

          target: JSONAPIService.REMOTE,
          filter: (t: Transform) => this.shouldUpdate(t, JSONAPIService.REMOTE),
          action: 'push',

          blocking: false
        }),
        // Sync all changes received from the remote server to the store
        new SyncStrategy({
          source: JSONAPIService.REMOTE,

          target: JSONAPIService.STORE,

          blocking: false
        }),
        // Sync all changes to the store to IndexedDB
        new SyncStrategy({
          source: JSONAPIService.STORE,

          target: JSONAPIService.BACKUP,
          filter: (t: Transform) => this.shouldUpdate(t, JSONAPIService.BACKUP),

          blocking: true
        }),
        new LogTruncationStrategy()
      ]
    });

    // restore backup
    const transforms = await this.backup.pull(q => q.findRecords());
    await this.store.sync(transforms);
    await this.coordinator.activate();
  }

  get<T extends Record>(resource: RecordIdentity): Observable<T> {
    return this._query(q => q.findRecord(resource));
  }

  getRelated<T extends Record>(resource: RecordIdentity, relationship: string): Observable<T> {
    return this._query(q => q.findRelatedRecord(resource, relationship));
  }

  getAll<T extends Record>(type: string, expressionBuilder = (t: FindRecordsTerm) => t): Observable<T[]> {
    return this._query(q => expressionBuilder(q.findRecords(type)));
  }

  getAllRelated<T extends Record>(resource: RecordIdentity, relationship: string): Observable<T[]> {
    return this._query(q => q.findRelatedRecords(resource, relationship));
  }

  private _query(queryOrExpression: QueryOrExpression): Observable<any> {
    const query = buildQuery(queryOrExpression, this.getOptions([JSONAPIService.REMOTE, JSONAPIService.BACKUP]),
      undefined, this.store.queryBuilder);

    this.store.query(query);

    const patch$ = fromEventPattern(
      (handler) => this.store.cache.on('patch', handler),
      (handler) => this.store.cache.off('patch', handler),
    );

    const reset$ = fromEventPattern(
      (handler) => this.store.cache.on('reset', handler),
      (handler) => this.store.cache.off('reset', handler),
    );

    return merge(patch$, reset$)
      .pipe(map(() => dcopy(this.store.cache.query(query))))
      .pipe(startWith(dcopy(this.store.cache.query(query))));
  }

  create(resource: Record, cache: boolean = true): Promise<void> {
    this.schema.initializeRecord(resource);
    return this._update(t => t.addRecord(dcopy(resource)), cache);
  }

  replace(resource: Record, cache: boolean = true): Promise<void> {
    return this._update(t => t.replaceRecord(dcopy(resource)), cache);
  }

  update(resource: RecordIdentity, attrs: Dict<any>, cache: boolean = true): Promise<void> {
    return this._update(t => {
      const ops: Operation[] = [];
      for (const [name, value] of Object.entries(attrs)) {
        ops.push(t.replaceAttribute(resource, name, value));
      }
      return ops;
    }, cache);
  }

  delete(resource: RecordIdentity, cache: boolean = true): Promise<void> {
    return this._update(t => t.removeRecord(resource), cache);
  }

  addRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, cache: boolean = true
  ): Promise<void> {
    return this._update(t => t.addToRelatedRecords(resource, relationship, related), cache);
  }

  removeRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, cache: boolean = true
  ): Promise<void> {
    return this._update(t => t.removeFromRelatedRecords(resource, relationship, related), cache);
  }

  replaceAllRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity[], cache: boolean = true
  ): Promise<void> {
    return this._update(t => t.replaceRelatedRecords(resource, relationship, related), cache);
  }

  setRelated(resource: RecordIdentity, relationship: string, related: RecordIdentity, cache: boolean = true
  ): Promise<void> {
    return this._update(t => t.replaceRelatedRecord(resource, relationship, related), cache);
  }

  private _update(transformOrOperations: TransformOrOperations, cache: boolean): Promise<void> {
    const update = [JSONAPIService.REMOTE];
    if (cache) {
      update.push(JSONAPIService.BACKUP);
    }
    return this.store.update(transformOrOperations, this.getOptions(update));
  }

  private getOptions(update: string[]): any {
    return {
      update,
      sources: {
        remote: {
          settings: {
            headers: {
              'Authorization': 'Bearer ' + this.oauthService.getAccessToken()
            }
          }
        }
      }
    };
  }

  private shouldUpdate(transform: Transform, source: string): boolean {
    if (transform.options == null || transform.options.update == null) {
      return true;
    }
    const update: string[] = transform.options.update;
    return update.includes(source);
  }

  private purgeDeletedResource(query: Query, ex: Exception): void {
    if (ex instanceof ClientError) {
      const response: Response = (ex as any).response;
      if (response.status === 404 && query.expression.op === 'findRecord') {
        this.removeFromBackup([(query.expression as FindRecord).record]);
      }
    }
  }

  private purgeDeletedResources(query: Query, result: Transform[]): void {
    const cachedResources: Record[] = this.store.cache.query(query);
    if (cachedResources.length === 0) {
      return;
    }

    const transform = result[0];
    const remoteResourceIds = new Set<string>();
    for (const op of transform.operations) {
      remoteResourceIds.add((op as ReplaceRecordOperation).record.id);
    }

    const deletedResources: Record[] = [];
    for (const cachedResource of cachedResources) {
      if (!remoteResourceIds.has(cachedResource.id)) {
        deletedResources.push(cachedResource);
      }
    }

    this.removeFromBackup(deletedResources);
  }

  private handleFailedPush(transform: Transform, ex: Exception): Promise<void> {
    if (ex instanceof NetworkError && this.shouldUpdate(transform, JSONAPIService.BACKUP)) {
      setTimeout(() => this.remote.requestQueue.retry(), JSONAPIService.RETRY_TIMEOUT);
    } else {
      if (this.store.transformLog.contains(transform.id)) {
        this.store.rollback(transform.id, -1);
      }
      return this.remote.requestQueue.skip();
    }
  }

  private removeFromBackup(resources: Record[]): void {
    if (resources.length === 0) {
      return;
    }

    this.store.update(t => {
      const ops: Operation[] = [];
      for (const resource of resources) {
        ops.push(t.removeRecord(resource));
      }
      return ops;
    }, { update: [JSONAPIService.BACKUP] });
  }
}
