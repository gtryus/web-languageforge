namespace SIL.XForge.Scripture.Models
{
    public class ScriptureConfigMetrics
    {
        public int ActiveEditTimeout { get; set; } = 5;
        public int EditingTimeout { get; set; } = 20 * 60;
    }
}
