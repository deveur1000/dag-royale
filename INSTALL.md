# DAG Royale Installation Guide

This guide will walk you through the process of setting up DAG Royale on your local machine for development and testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- PostgreSQL (v12.0 or later)
- Git

## Step 1: Clone the Repository

1. Open your terminal.
2. Clone the DAG Royale repository:
   ```
   git clone https://github.com/deveur1000/dag-royale/
   cd dag-royale
   ```

## Step 2: Install Dependencies

Install the project dependencies:

```
npm install
```

Install also:

```
npm install dotenv
```

## Step 3: Set Up the Database

Note: The following database commands should be run in a terminal or command prompt with PostgreSQL access. Depending on your operating system and PostgreSQL installation, you may need to adjust these commands. For example, you might need to use sudo on some systems, or use the PostgreSQL command prompt on Windows.

1. Open the PostgreSQL interactive terminal:
   - On Windows: Open "SQL Shell (psql)" from the Start menu
   - On macOS/Linux: Open a terminal and type `psql -U postgres`

2. Once connected, create the database with SQL:

   ```sql
   CREATE DATABASE dag_royale;
   ```

3. Connect to the new database:

   ```sql
   \c dag_royale
   ```

4. Locate the `setup.sql` file in your project's `database` folder.

5. Open the `setup.sql` file in a text editor and copy its entire contents.

6. Paste the contents into the psql prompt and press Enter to execute the SQL commands.

7. To verify that the tables have been created successfully, run:

   ```sql
   \dt
   ```

   You should see `draws` and `distributions` in the list of relations.

8. Exit psql by typing `\q` and pressing Enter.

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root directory of the project:

On windows:
   ```
   echo. > .env
   ```

On macOS/Linux:
   ```
   touch .env
   ```

2. Open the `.env` file in a text editor and add the following variables:
   ```
   DBUSER=your_postgres_username
   PGHOST=localhost
   PGDATABASE=dag_royale
   DBUSERPASSWORD= 'the password for the user on your setup.sql script'
   PGPORT=5432
   PRIVATE_KEY=your_dag_private_key
   PUBLIC_KEY=your_dag_public_key
   CRON_SCHEDULE="0 21 * * *"
   ```
   Replace the placeholder values with your actual PostgreSQL credentials and DAG keys.

## Step 5: Set Up the Constellation Network Connection

1. Ensure you have a DAG wallet set up on the Constellation Network.
2. Replace `your_dag_private_key` and `your_dag_public_key` in the `.env` file with your actual DAG wallet keys.

## Step 6: Start the Application

1. Start the server:
   ```
   node index.j
   ```

2. The server should now be running on `http://localhost:3000`.

## Step 7: Access the Application

Open your web browser and navigate to `http://localhost:3000`. You should see the DAG Royale interface.

## Troubleshooting

If you encounter any issues during the installation process, try the following:

1. Ensure all prerequisites are correctly installed and up to date.
2. Double-check that your `.env` file contains the correct information.
3. Make sure your PostgreSQL server is running.
4. Check the console output for any error messages.

If problems persist, please open an issue on the GitHub repository with details about the error you're encountering.


