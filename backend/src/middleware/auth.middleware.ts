import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'No autorizado' });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user as { rol?: string };
  if (user.rol !== 'ADMINISTRADOR') {
    reply.status(403).send({ error: 'Se requieren permisos de administrador' });
  }
}
