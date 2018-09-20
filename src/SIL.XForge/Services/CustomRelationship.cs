using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using JsonApiDotNetCore.Internal;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using SIL.XForge.Models;

namespace SIL.XForge.Services
{
    public class CustomRelationship<TThisEntity, TOtherResource, TOtherEntity> : IRelationship<TThisEntity>
        where TThisEntity : Entity
        where TOtherResource : Resource
        where TOtherEntity : Entity
    {
        private readonly IResourceMapper<TOtherResource, TOtherEntity> _otherResourceMapper;
        private readonly Func<TThisEntity, Expression<Func<TOtherEntity, bool>>> _createPredicate;
        private readonly Func<UpdateDefinitionBuilder<TThisEntity>, IEnumerable<string>, UpdateDefinition<TThisEntity>> _createOperation;

        public CustomRelationship(IResourceMapper<TOtherResource, TOtherEntity> otherResourceMapper,
            Func<TThisEntity, Expression<Func<TOtherEntity, bool>>> createPredicate,
            Func<UpdateDefinitionBuilder<TThisEntity>, IEnumerable<string>, UpdateDefinition<TThisEntity>> createOperation = null)
        {
            _otherResourceMapper = otherResourceMapper;
            _createPredicate = createPredicate;
            _createOperation = createOperation;
        }

        public async Task<IEnumerable<Resource>> GetResourcesAsync(IEnumerable<string> included,
            Dictionary<string, Resource> resources, TThisEntity entity)
        {
            return await _otherResourceMapper.MapMatchingAsync(included, resources, q => q.Where(_createPredicate(entity)));
        }

        public UpdateDefinition<TThisEntity> GetUpdateOperation(UpdateDefinitionBuilder<TThisEntity> update,
            IEnumerable<string> ids)
        {
            if (_createOperation == null)
                throw new JsonApiException(StatusCodes.Status400BadRequest, "The relationship cannot be updated.");
            return _createOperation(update, ids);
        }
    }
}
