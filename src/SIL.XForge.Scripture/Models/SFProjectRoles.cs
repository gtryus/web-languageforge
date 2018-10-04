using System.Collections.Generic;
using SIL.XForge.Models;

namespace SIL.XForge.Scripture.Models
{
    public class SFProjectRoles : ProjectRoles
    {
        public const string Administrator = "pt_administrator";
        public const string Translator = "pt_translator";

        public static SFProjectRoles Instance { get; } = new SFProjectRoles();

        private SFProjectRoles()
        {
            var translatorRights = new HashSet<Right>
            {
                new Right(Domain.Texts, Operation.View),
                new Right(Domain.Texts, Operation.Edit),
                new Right(Domain.Texts, Operation.Create),
                new Right(Domain.Texts, Operation.Delete),
                new Right(Domain.Questions, Operation.View),
                new Right(Domain.Answers, Operation.View),
                new Right(Domain.Answers, Operation.Create),
                new Right(Domain.Answers, Operation.EditOwn),
                new Right(Domain.Answers, Operation.DeleteOwn),
                new Right(Domain.Comments, Operation.View),
                new Right(Domain.Comments, Operation.Create),
                new Right(Domain.Comments, Operation.EditOwn),
                new Right(Domain.Comments, Operation.DeleteOwn),
                new Right(Domain.SyncJobs, Operation.View),
                new Right(Domain.SyncJobs, Operation.Create),
                new Right(Domain.SyncJobs, Operation.Delete)
            };
            Rights[Translator] = translatorRights;

            var administratorRights = new HashSet<Right>(translatorRights)
            {
                new Right(Domain.Texts, Operation.Create),
                new Right(Domain.Texts, Operation.Edit),
                new Right(Domain.Texts, Operation.Archive),
                new Right(Domain.Questions, Operation.Create),
                new Right(Domain.Questions, Operation.Edit),
                new Right(Domain.Questions, Operation.Archive),
                new Right(Domain.Answers, Operation.Edit),
                new Right(Domain.Answers, Operation.Delete),
                new Right(Domain.Comments, Operation.Edit),
                new Right(Domain.Comments, Operation.Delete),
                new Right(Domain.Tags, Operation.Create),
                new Right(Domain.Tags, Operation.Edit),
                new Right(Domain.Tags, Operation.Delete)
            };
            Rights[Administrator] = administratorRights;
        }
    }
}
