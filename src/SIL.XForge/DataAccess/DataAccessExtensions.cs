using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using SIL.XForge.Models;
using SIL.XForge.Utils;

namespace SIL.XForge.DataAccess
{
    public static class DataAccessExtensions
    {
        public static Task<T> UpdateAsync<T>(this IRepository<T> repo, T entity,
            Func<UpdateDefinitionBuilder<T>, UpdateDefinition<T>> update, bool upsert = false) where T : Entity
        {
            return repo.UpdateAsync(e => e.Id == entity.Id, update, upsert);
        }

        public static async Task<T> DeleteAsync<T>(this IRepository<T> repo, string id) where T : Entity
        {
            return await repo.DeleteAsync(e => e.Id == id);
        }

        public static async Task<T> GetAsync<T>(this IRepository<T> repo, string id) where T : Entity
        {
            Attempt<T> attempt = await repo.TryGetAsync(id);
            if (attempt.Success)
                return attempt.Result;
            return default(T);
        }

        public static async Task<IReadOnlyList<T>> GetAllAsync<T>(this IRepository<T> repo) where T : Entity
        {
            return await repo.Query().ToListAsync();
        }

        public static async Task<Attempt<T>> TryGetAsync<T>(this IRepository<T> repo, string id) where T : Entity
        {
            T entity = await repo.Query().Where(e => e.Id == id).FirstOrDefaultAsync();
            return new Attempt<T>(entity != null, entity);
        }

        public static async Task<List<TResult>> ToListAsync<TSource, TResult>(this IMongoQueryable<TSource> query,
            Func<TSource, Task<TResult>> selector)
        {
            var results = new List<TResult>();
            using (IAsyncCursor<TSource> cursor = await query.ToCursorAsync())
            {
                while (await cursor.MoveNextAsync())
                {
                    foreach (TSource entity in cursor.Current)
                        results.Add(await selector(entity));
                }
            }
            return results;
        }

        public static Task<List<TResult>> ToListAsync<TSource, TResult>(this IMongoQueryable<TSource> query,
            Func<TSource, TResult> selector)
        {
            return query.ToListAsync(e => Task.FromResult(selector(e)));
        }
    }
}
