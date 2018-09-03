using System.Collections.Generic;
using JsonApiDotNetCore.Models;

namespace SIL.XForge.Models
{
    public class ProjectResource : ProjectDataResource
    {
        [Attr("project-name")]
        public string ProjectName { get; set; }
        [Attr("project-code")]
        public string ProjectCode { get; set; }
        [Attr("user-roles")]
        public IDictionary<string, ProjectRole> Users { get; set; }
    }
}
