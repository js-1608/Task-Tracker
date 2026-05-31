// src/modules/projects/projects.service.ts
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true } },
};

export async function listProjects(orgId: string) {
  return prisma.project.findMany({
    where: { orgId },
    select: PROJECT_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: PROJECT_SELECT,
  });
  if (!project) throw ApiError.notFound(`Project ${projectId} not found`);
  return project;
}

export async function createProject(orgId: string, userId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: { ...input, orgId, createdById: userId },
    select: PROJECT_SELECT,
  });
}

export async function updateProject(orgId: string, projectId: string, input: UpdateProjectInput) {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw ApiError.notFound(`Project ${projectId} not found`);

  return prisma.project.update({
    where: { id: projectId },
    data: input,
    select: PROJECT_SELECT,
  });
}

export async function deleteProject(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
  if (!project) throw ApiError.notFound(`Project ${projectId} not found`);
  await prisma.project.delete({ where: { id: projectId } });
}
