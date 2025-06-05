import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import crypto, { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies;
      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();

      return {
        transactions,
      };
    }
  );

  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(request.params);
    const { sessionId } = request.cookies;

    //first para não retornar como array, pois cada ID é único para transações
    const transaction = await knex("transactions")
      .where("id", id)
      .andWhere("session_id", sessionId)
      .first();

    return {
      transaction,
    };
  });

  app.get(
    "/summary",
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies;
      const summary = await knex("transactions")
        .sum("amount", { as: "amount" })
        .where("session_id", sessionId)
        .first();

      return {summary};
    }
  );

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
    }

    await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    //201 - recurso criado com sucesso

    return reply.status(201).send();
  });
}
