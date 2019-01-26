using JsonApiDotNetCore.Models;
using SIL.Scripture;

namespace SIL.XForge.Scripture.Models
{
    public class QuestionResource : SFProjectDataResource
    {
        [Attr(isImmutable: true)]
        public string Source { get; set; }
        [Attr]
        public VerseRef ScriptureStart { get; set; }
        [Attr]
        public VerseRef ScriptureEnd { get; set; }
        [Attr]
        public string Text { get; set; }
    }
}
