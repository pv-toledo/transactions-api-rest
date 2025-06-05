import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('transactions', (table) => {
        //index() faz ficar mais rápida a utilização de where nesse campo, por exemplo
        table.uuid('session_id').after('id').index()
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('transactions', (table) => {
        table.dropColumn('session_id')
    })
}

