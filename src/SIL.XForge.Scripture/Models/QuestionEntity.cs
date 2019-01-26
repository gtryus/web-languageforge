using SIL.Scripture;
using SIL.XForge.Models;

namespace SIL.XForge.Scripture.Models
{
    public class QuestionEntity : ProjectDataEntity
    {
        public const string CreatedSource = "Created";
        public const string TransceleratorSource = "Transcelerator";

        public string Source { get; set; }
        public VerseRef ScriptureStart { get; set; }
        public VerseRef ScriptureEnd { get; set; }
        public string Text { get; set; }
        public string ModelAnswer { get; set; }
    }
}
