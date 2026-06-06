namespace EJournal.Models
{
    public enum UserRole
    {
        Admin,
        Editor,
        Reviewer,
        Author
    }

    public enum ArticleStatus
    {
        Draft,
        Submitted,      // Submitted by author, pending editor review
        UnderReview,    // Reviewers assigned, pending their recommendations
        UnderRevision,  // Revisions requested by editor, pending author action
        Accepted,       // Accepted for publication, awaiting issue assignment
        Rejected,       // Rejected by editor
        Published       // Assigned to a volume/issue and published publicly
    }

    public enum ReviewStatus
    {
        Pending,
        Completed
    }

    public enum Recommendation
    {
        None,
        Accept,
        Revision,
        Reject
    }
}
