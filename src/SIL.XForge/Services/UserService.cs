using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AutoMapper;
using JsonApiDotNetCore.Internal.Query;
using JsonApiDotNetCore.Services;
using Microsoft.Extensions.Options;
using SIL.XForge.Configuration;
using SIL.XForge.DataAccess;
using SIL.XForge.Models;

namespace SIL.XForge.Services
{
    public class UserService<TResource> : RepositoryResourceServiceBase<TResource, UserEntity>
        where TResource : UserResource
    {
        private readonly IOptions<SiteOptions> _options;

        public UserService(IJsonApiContext jsonApiContext, IMapper mapper, IUserAccessor userAccessor,
            IRepository<UserEntity> users, IOptions<SiteOptions> options)
            : base(jsonApiContext, mapper, userAccessor, users)
        {
            _options = options;
        }

        protected override IQueryable<UserEntity> ApplyFilter(IQueryable<UserEntity> entities,
            FilterQuery filter)
        {
            if (filter.Attribute == "search")
            {
                string value = filter.Value.ToLowerInvariant();
                return entities.Where(u => u.Name.ToLowerInvariant().Contains(value)
                    || u.CanonicalEmail.Contains(UserEntity.CanonicalizeEmail(filter.Value)));
            }
            return base.ApplyFilter(entities, filter);
        }

        protected override Task<UserEntity> InsertEntityAsync(UserEntity entity)
        {
            if (!string.IsNullOrEmpty(entity.Username))
                entity.Username = entity.Username.ToLowerInvariant();
            if (!string.IsNullOrEmpty(entity.Password))
                entity.Password = BCrypt.Net.BCrypt.HashPassword((string)entity.Password, 7);
            entity.CanonicalEmail = UserEntity.CanonicalizeEmail(entity.Email);
            return base.InsertEntityAsync(entity);
        }

        protected override Task<UserEntity> UpdateEntityAsync(string id, IDictionary<string, object> attrs,
            IDictionary<string, string> relationships)
        {
            if (attrs.TryGetValue(nameof(UserEntity.Username), out object username))
                attrs[nameof(UserEntity.Username)] = ((string)username).ToLowerInvariant();
            if (attrs.TryGetValue(nameof(UserEntity.Password), out object password))
                attrs[nameof(UserEntity.Password)] = BCrypt.Net.BCrypt.HashPassword((string)password, 7);
            if (attrs.TryGetValue(nameof(UserEntity.Email), out object email))
                attrs[nameof(UserEntity.CanonicalEmail)] = UserEntity.CanonicalizeEmail((string)email);
            if (attrs.TryGetValue(nameof(UserEntity.ParatextId), out object paratextId))
            {
                if (paratextId == null)
                    attrs[nameof(UserEntity.ParatextTokens)] = null;
            }
            if (attrs.TryGetValue(nameof(UserResource.Site), out object site))
            {
                SiteOptions siteOptions = _options.Value;
                string serializedSiteKey = SiteDomainSerializer.ConvertDotIn(siteOptions.Origin.Authority);
                attrs[nameof(UserEntity.Sites) + "." + serializedSiteKey] = (Site)site;
                attrs.Remove(nameof(UserResource.Site));
            }
            return base.UpdateEntityAsync(id, attrs, relationships);
        }

        protected override Task CheckCanCreateAsync(TResource resource)
        {
            if (SystemRole == SystemRoles.User)
                throw ForbiddenException();
            return Task.CompletedTask;
        }

        protected override Task CheckCanUpdateAsync(string id, IDictionary<string, object> attrs,
            IDictionary<string, string> relationships)
        {
            if (attrs.ContainsKey("Email"))
            {
                if (string.IsNullOrEmpty(attrs["Email"] as string))
                {
                    throw BadRequestException();
                }

                var regex = new Regex(@"^[A-Za-z]+@[A-Za-z.]+$");
                if (!regex.IsMatch(attrs["Email"] as string))
                {
                    throw BadRequestException();
                }
            }

            return CheckCanUpdateDeleteAsync(id);
        }

        protected override Task CheckCanUpdateRelationshipAsync(string id)
        {
            return CheckCanUpdateDeleteAsync(id);
        }

        protected override Task CheckCanDeleteAsync(string id)
        {
            return CheckCanUpdateDeleteAsync(id);
        }

        protected override Task<IQueryable<UserEntity>> ApplyPermissionFilterAsync(IQueryable<UserEntity> query)
        {
            if (SystemRole == SystemRoles.User)
                query = query.Where(u => u.Id == UserId);
            return Task.FromResult(query);
        }

        private Task CheckCanUpdateDeleteAsync(string id)
        {
            if (SystemRole == SystemRoles.User && id != UserId)
                throw ForbiddenException();
            return Task.CompletedTask;
        }
    }
}
