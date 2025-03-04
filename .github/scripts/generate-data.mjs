import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs/promises';

(async () => {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const schemaDump = await fs.readFile('schema.sql', 'utf8');
    console.log('Schema file read successfully');

    console.log('Calling Anthropic API...');
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: 'You are a seasoned database administrator at a Fortune 500 company.',
      messages: [
        {
          role: 'user',
          content: `
              I have a database schema below, which outlines the structure of various tables and their relationships. Based on this schema, I would like you to generate the following:

              1. Synthetic Data: Create synthetic data for each table in the schema. Ensure the data respects the data types and constraints defined in the schema (e.g., integers, text, dates, foreign keys).

              2. Partially mask any data relating to last names, addresses and email using the * symbol.

              3. Replace any data relating to passwords with ####.

              4. Leave any data relating to dates untouched.

              5. After generating the synthetic data, please generate the corresponding SQL INSERT statements to populate the tables with the synthetic data.

              Instructions:
              - Review the schema carefully, paying attention to the column types, relationships between tables (foreign keys), and any other constraints like unique keys or not-null fields.
              - Generate a reasonable number of rows (you can decide on the number based on the complexity of the schema). Generate 10 rows of data.
              - Ensure the generated data is varied but logically valid according to the schema (e.g., no duplicate primary keys, valid foreign key references, etc.).
              - If there are any constraints like unique or foreign key constraints, make sure the data adheres to those as well.

              Additional instructions:
              - IMPORTANT: All INSERT statements MUST use schema-qualified table names like 'INSERT INTO public.users' instead of just 'INSERT INTO users'. All tables are in the 'public' schema.
              - Ensure all email addresses are UNIQUE across all generated rows
              - For any foreign key relationships (like transactions.user_id referencing users.id):
                * Only use IDs that were successfully inserted in previous tables
                * Track which IDs were successfully inserted and only reference those
              - Insert tables in the correct order: first parent tables (like users), then child tables (like transactions)

              Here is the schema:

              ${schemaDump}

              Now, please proceed with the following:
              1. Generate synthetic data for each table based on the schema above.
              2. Generate SQL INSERT statements for each table, inserting the synthetic data you've created.

              Please format the output clearly, with the SQL INSERT statements for each table listed after the corresponding synthetic data. Please don't add any headings, comments, text, or explanations. I only need the SQL INSERT statements. Do not include any comments like '-- Users table inserts' or any other annotations. Please produce an output that can be used directly with psql.

              REMINDER: All table references MUST be fully qualified with the schema name, like 'public.users', 'public.products', etc.`,
        },
      ],
    });

    const cleanSql = msg.content[0].text.replace(/\\n/g, ' ');
    console.log(cleanSql);
    fs.writeFile('./data.sql', cleanSql);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
