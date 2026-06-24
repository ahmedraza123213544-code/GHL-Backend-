import prisma from '../database/client.js';
import { AppError } from '../utils/AppError.js';

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateTemplatePayload(data, { partial = false } = {}) {
  if (!data || typeof data !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400, { code: 'INVALID_BODY' });
  }

  const result = {};

  if (!partial || data.name !== undefined) {
    const name = String(data.name ?? '').trim();
    if (!name) {
      throw new AppError('Field `name` is required.', 400, { code: 'INVALID_BODY' });
    }
    result.name = name;
  }

  if (!partial || data.industry !== undefined) {
    const industry = String(data.industry ?? '').trim();
    if (!industry) {
      throw new AppError('Field `industry` is required.', 400, { code: 'INVALID_BODY' });
    }
    result.industry = industry;
  }

  if (!partial || data.slug !== undefined) {
    const slug = slugify(data.slug ?? data.name);
    if (!slug) {
      throw new AppError('Field `slug` is required.', 400, { code: 'INVALID_BODY' });
    }
    result.slug = slug;
  }

  if (data.description !== undefined) {
    result.description =
      data.description == null || data.description === ''
        ? null
        : String(data.description).trim();
  }

  if (data.previewImage !== undefined) {
    result.previewImage =
      data.previewImage == null || data.previewImage === ''
        ? null
        : String(data.previewImage).trim();
  }

  if (data.isActive !== undefined) {
    result.isActive = Boolean(data.isActive);
  }

  return result;
}

export async function getAllTemplates() {
  return prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplateBySlug(slug) {
  const normalized = slugify(slug);
  const template = await prisma.template.findFirst({
    where: { slug: normalized, isActive: true },
  });

  if (!template) {
    throw new AppError('Template not found.', 404, { code: 'TEMPLATE_NOT_FOUND' });
  }

  return template;
}

export async function createTemplate(data) {
  const payload = validateTemplatePayload(data);

  const existing = await prisma.template.findUnique({
    where: { slug: payload.slug },
  });
  if (existing) {
    throw new AppError('A template with this slug already exists.', 409, {
      code: 'TEMPLATE_SLUG_EXISTS',
    });
  }

  return prisma.template.create({ data: payload });
}

export async function updateTemplate(id, data) {
  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Template not found.', 404, { code: 'TEMPLATE_NOT_FOUND' });
  }

  const payload = validateTemplatePayload(data, { partial: true });
  if (Object.keys(payload).length === 0) {
    throw new AppError('No valid fields to update.', 400, { code: 'INVALID_BODY' });
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const conflict = await prisma.template.findUnique({ where: { slug: payload.slug } });
    if (conflict) {
      throw new AppError('A template with this slug already exists.', 409, {
        code: 'TEMPLATE_SLUG_EXISTS',
      });
    }
  }

  return prisma.template.update({
    where: { id },
    data: payload,
  });
}

export async function deleteTemplate(id) {
  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Template not found.', 404, { code: 'TEMPLATE_NOT_FOUND' });
  }

  return prisma.template.update({
    where: { id },
    data: { isActive: false },
  });
}
