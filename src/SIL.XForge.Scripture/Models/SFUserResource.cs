using System.Collections.Generic;
using JsonApiDotNetCore.Models;
using SIL.XForge.Models;

namespace SIL.XForge.Scripture.Models
{
    public class SFUserResource : UserResource
    {
        [HasMany("projects")]
        public IReadOnlyList<SFProjectUserResource> Projects { get; set; }
    }
}