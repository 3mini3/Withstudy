'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';

const SUBJECT_OPTIONS = new Set(['math', 'science', 'english', 'social-studies', 'japanese']);

function sanitizeEmail(value) {
  return value?.toString().trim().toLowerCase() || '';
}

function sanitizePassword(value) {
  return value?.toString() || '';
}

export async function registerAction(prevState, formData) {
  const email = sanitizeEmail(formData.get('email'));
  const password = sanitizePassword(formData.get('password'));
  const confirmPassword = sanitizePassword(formData.get('confirmPassword'));

  if (!email || !password || !confirmPassword) {
    return { error: 'メールアドレスとパスワードを入力してください。' };
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません。' };
  }

  if (password.length < 8) {
    return { error: 'パスワードは8文字以上にしてください。' };
  }

  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    return { error: 'このメールアドレスはすでに登録されています。' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.student.create({
    data: {
      email,
      passwordHash
    }
  });

  cookies().set({
    name: 'withstady-session',
    value: JSON.stringify({ email }),
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect('/profile');
}

export async function loginAction(prevState, formData) {
  const email = sanitizeEmail(formData.get('email'));
  const password = sanitizePassword(formData.get('password'));

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください。' };
  }

  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
  }

  const isValidPassword = await bcrypt.compare(password, student.passwordHash);

  if (!isValidPassword) {
    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
  }

  cookies().set({
    name: 'withstady-session',
    value: JSON.stringify({ email }),
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  if (!student.grade || !student.favoriteSubject) {
    redirect('/profile');
  }

  redirect('/');
}

export async function updateProfileAction(prevState, formData) {
  const sessionCookie = cookies().get('withstady-session');

  if (!sessionCookie?.value) {
    return { error: 'ログインが必要です。' };
  }

  let email = '';
  try {
    const parsed = JSON.parse(sessionCookie.value);
    if (typeof parsed?.email === 'string' && parsed.email.trim()) {
      email = parsed.email.trim().toLowerCase();
    }
  } catch (error) {
    return { error: 'セッション情報の取得に失敗しました。' };
  }

  if (!email) {
    return { error: 'ログインが必要です。' };
  }

  const gradeRaw = formData.get('grade')?.toString().trim() || '';
  const favoriteSubject = formData.get('favoriteSubject')?.toString().trim() || '';
  const mockExamRaw = formData.get('mockExamScore')?.toString().trim() || '';

  if (!gradeRaw) {
    return { error: '学年を選択してください。' };
  }

  const grade = Number(gradeRaw);

  if (Number.isNaN(grade) || grade < 1 || grade > 3) {
    return { error: '学年は1〜3の数字で入力してください。' };
  }

  if (!favoriteSubject || !SUBJECT_OPTIONS.has(favoriteSubject)) {
    return { error: '得意教科を選択してください。' };
  }

  const mockExamScore = mockExamRaw ? Number(mockExamRaw) : null;
  if (mockExamRaw && (Number.isNaN(mockExamScore) || mockExamScore < 0 || mockExamScore > 100)) {
    return { error: '模試の点数は0〜100の範囲で入力してください。' };
  }

  await prisma.student.update({
    where: { email },
    data: {
      grade,
      favoriteSubject,
      mockExamScore
    }
  });

  redirect('/');
}
