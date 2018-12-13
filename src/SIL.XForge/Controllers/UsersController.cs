using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using JsonApiDotNetCore.Models;
using JsonApiDotNetCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SIL.XForge.Configuration;
using SIL.XForge.DataAccess;
using SIL.XForge.Models;

namespace SIL.XForge.Controllers
{

    public class UsersController<T> : JsonApiControllerBase<T> where T : UserResource
    {
        private readonly IOptions<SiteOptions> _appOptions;
        private readonly IRepository<UserEntity> _users;

        public UsersController(IJsonApiContext jsonApiContext, IResourceService<T, string> resourceService,
            ILoggerFactory loggerFactory, IRepository<UserEntity> users, IOptions<SiteOptions> appOptions) : base(jsonApiContext, resourceService, loggerFactory)
        {
            _users = users;
            _appOptions = appOptions;
        }

        [HttpPost("userAvatarUpload")]
        public async Task<IActionResult> userAvatarUploadAsync()
        {
            var file = HttpContext.Request.Form.Files[0];
            var dict = Request.Form.ToDictionary(x => x.Key, x => x.Value.ToString());
            var userName = dict["UserName"];

            string relativeFilePath = await this.SaveAssetAsync(file);
            string relativeDirPath = System.IO.Path.GetDirectoryName(relativeFilePath).Replace('\\', '/');
            string fileName = Path.GetFileName(relativeFilePath);
            string url = Uri.EscapeUriString("/" + relativeFilePath.Replace('\\', '/'));
            UserEntity user = await _users.UpdateAsync(
                         u => u.Username == userName,
                         update => update
                        .Set(u => u.Avatar_ref, "/" + fileName));
            return Created(url, new AssetDto { Path = relativeDirPath, FileName = fileName });
        }

        private async Task<string> SaveAssetAsync(IFormFile file)
        {
            string rootDir = _appOptions.Value.RootDir;
            string filePath = Path.Combine("SIL.XForge.Scripture/wwwroot");
            string relativeAssetDir = Path.Combine(filePath, "pictures");

            string assetDir = Path.Combine(rootDir, relativeAssetDir);
            if (!Directory.Exists(assetDir))
                Directory.CreateDirectory(assetDir);
            string filePrefix = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            string fileName = filePrefix + "_" + file.FileName;
            using (var stream = new FileStream(Path.Combine(assetDir, fileName), FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            return Path.Combine(relativeAssetDir, fileName);
        }
    }
}
