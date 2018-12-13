using JsonApiDotNetCore.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SIL.XForge.Configuration;
using SIL.XForge.DataAccess;
using SIL.XForge.Models;
using SIL.XForge.Scripture.Models;

namespace SIL.XForge.Controllers
{
    [Route("users")]
    public class SFUsersController : UsersController<SFUserResource>
    {
        public SFUsersController(IJsonApiContext jsonApiContext, IResourceService<SFUserResource, string> resourceService,
            ILoggerFactory loggerFactory, IRepository<UserEntity> users, IOptions<SiteOptions> appOptions) :
            base(jsonApiContext, resourceService, loggerFactory, users, appOptions)
        {
        }
    }
}
