/**
 * Student data extraction and fallback utilities.
 * Handles diverse API response structures and gracefully falls back
 * when nested user records or contact fields are null.
 */

export function getStudentDisplayName(student: any): string {
  if (!student) return 'Student';
  const name =
    student.user?.name ||
    student.displayName ||
    student.name ||
    student.studentProfile?.displayName ||
    student.studentProfile?.user?.name;

  if (name && typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  const id = student.id || student.studentProfileId || student.userId;
  if (id && typeof id === 'string') {
    return `Student (${id.substring(0, 6).toUpperCase()})`;
  }

  return 'Student';
}

export function getStudentInitials(student: any): string {
  const name = getStudentDisplayName(student);
  if (name.startsWith('Student (')) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name[0] || 'S').toUpperCase();
}

export function getStudentEmail(student: any): string {
  if (!student) return 'N/A';
  const email =
    student.user?.email ||
    student.contactEmail ||
    student.email ||
    student.studentProfile?.contactEmail ||
    student.studentProfile?.user?.email;

  if (email && typeof email === 'string' && email.trim()) {
    return email.trim();
  }
  return 'N/A';
}

export function getStudentMobile(student: any): string {
  if (!student) return 'N/A';
  const mobile =
    student.user?.mobile ||
    student.contactMobile ||
    student.mobile ||
    student.studentProfile?.contactMobile ||
    student.studentProfile?.user?.mobile;

  if (mobile && typeof mobile === 'string' && mobile.trim()) {
    return mobile.trim();
  }
  return 'N/A';
}

export function getStudentBranchName(student: any, branches?: Array<{ id: string; name: string }>): string {
  if (!student) return 'Main Branch';
  if (student.branch?.name) return student.branch.name;

  const branchId = student.branchId || student.studentProfile?.branchId;
  if (branchId && Array.isArray(branches)) {
    const found = branches.find((b) => b.id === branchId);
    if (found?.name) return found.name;
  }

  return 'Main Branch';
}
