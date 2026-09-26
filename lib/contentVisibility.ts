/** Remove admin-only and unpublished data before returning the CMS blob publicly. */
export const publicContentView = (content: any): any => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return content;
  const result: Record<string, any> = { ...content };

  for (const key of ['BLOG_POSTS', 'SERVICES', 'PRODUCTS', 'CASE_STUDIES']) {
    if (Array.isArray(result[key])) {
      result[key] = result[key].filter((item: any) => item && item.status !== 'draft');
    }
  }

  // Version history and audit notes may contain old drafts or private admin data.
  result.VERSION_HISTORY = [];
  result.AUDIT_LOGS = [];

  // Pending comments and email addresses are private; visitors only need approved,
  // email-redacted comments. Admin gets the original payload via authenticated GET.
  result.BLOG_COMMENTS = Array.isArray(result.BLOG_COMMENTS)
    ? result.BLOG_COMMENTS
        .filter((comment: any) => comment && comment.isApproved === true)
        .map((comment: any) => ({ ...comment, authorEmail: '' }))
    : [];

  return result;
};
