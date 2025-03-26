# APA1 Supa Task Backend

This is where you'll design and deploy your API for access by your frontend

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Deno](https://deno.land/) (for running Edge Functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Hoppscotch](https://hoppscotch.io/) or [Postman](https://www.postman.com/) for API testing
- [curl](https://curl.se/) for testing functions locally

## Getting Started

Before starting with this project please set up an account with [Supabase](https://supabase.com/)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

`npm install`

**Very important, if you are working on your project in cloud spaces prefix all your supabase commands with `npx`**

### 3. Authenticate with Supabase
The first step is to authenticate with Supabase:

```bash
supabase login
```

This will open a browser window where you can authenticate with Supabase and generate an access token.

### 4. Link

Once authenticated, link your local project to your Supabase project:

```bash
supabase link --project-ref your_project_id
```

### 5. Working with Edge Functions

**Creating a New Edge Function**

```bash
supabase functions new my-function-name
```

This creates a new function in supabase/functions/my-function-name/

**Deploying your Edge functions**

```bash
supabase functions deploy
```

## Database Structure

The application uses a todos table with the following structure:

| Column     | Type       | Description                           |
|------------|-----------|---------------------------------------|
| id         | uuid      | Primary key, automatically generated |
| todo       | text      | The content of the todo item         |
| priority   | text      | Priority level (low, medium, high)   |
| created_at | timestamp | Creation timestamp, used for ordering |

## Important Functionalities

**Todos Functions**

The backend includes a set of functions to manage "todos". These functions allow you to:

- Create a Todo: Add a new task to the list.
- Read Todos: Retrieve existing tasks, with options for filtering.
- Update a Todo: Modify details of an existing task.
- Delete a Todo: Remove a task from the list.

**API Endpoints**

All endpoints are accessed through: `https://your-project-ref.supabase.co/functions/v1/todos`

| Method | Purpose | Request Body | Query Params | Response |
|--------|---------|--------------|--------------|----------|
| GET | Retrieve todos | None | `priority` (optional) | Array of todo objects |
| POST | Create todo | `{ "todo": "Task text", "priority": "low" }` | None | Created todo object |
| PUT | Update todo | `{ "id": "uuid", "todo": "Updated text", "priority": "medium" }` | None | Updated todo object |
| DELETE | Delete todo | `{ "id": "uuid" }` | None | Success message |

**Priority Filter Example:** 

To filter by priority, use `?priority=high` (accepts "low", "medium", "high")

**Filtering**

The backend supports filtering of todos based on their priority. This is implemented using query parameters in the API endpoints. When retrieving todos, you can specify a priority level to filter the results. For example, to filter todos by high priority, you might use a query parameter like ?priority=high.

## Manual Testing

We conducted manual testing of the endpoints using [Hoppscotch](https://hoppscotch.io/). Here’s what to expect from each request:

- Create a Todo: Expect a 201 status code with the created todo object in the response.
- Read Todos: Expect a 200 status code with an array of todos, optionally filtered by priority.
- Update a Todo: Expect a 200 status code with the updated todo object.
- Delete a Todo: Expect a 204 status code indicating successful deletion.

## Debugging and Troubleshooting

To assist with debugging, you can add console logs throughout your Edge Functions. These logs will be visible in the Supabase Dashboard and can help identify issues during execution.

**Adding Console Logs for Debugging**

Here's how you can add helpful console logs to each request type in your existing function:

```bash
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  // Simple content-type header is all we need
  const headers = {"Content-Type": "application/json"};
  const url = new URL(req.url);
  const priority = url.searchParams.get("priority");

  // Uncomment for request debugging
  // console.log(`[Request] ${req.method} ${url.pathname} at ${new Date().toISOString()}`);
  
  try {
    if (req.method === "GET") {
      // Uncomment for GET request debugging
      // console.log(`[GET] Fetching todos with priority filter: ${priority || 'none'}`);
      
      let query = supabase.from("todos").select("*").order("created_at", {ascending: false});

      if (priority) {
        query = query.eq("priority", priority);
        // Uncomment to debug priority filtering
        // console.log(`[GET] Applying priority filter: ${priority}`);
      }

      const {data, error} = await query;
      
      if (error) {
        // Uncomment to debug database errors
        // console.error(`[GET] Database error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      // Uncomment to see the retrieved data
      // console.log(`[GET] Successfully retrieved ${data.length} todos`);
      return new Response(JSON.stringify(data), {headers});
    }

    if (req.method === "POST") {
      // Uncomment for POST request debugging
      // console.log(`[POST] Creating new todo`);
      
      const body = await req.json();
      const { todo, priority = "low" } = body;
      
      // Uncomment to view request body
      // console.log(`[POST] Request body: ${JSON.stringify(body)}`);

      const { data, error } = await supabase
          .from("todos")
          .insert([{ todo, priority }])
          .select();

      if (error) {
        // Uncomment to debug insertion errors
        // console.error(`[POST] Insert error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      // Uncomment to see created todo
      // console.log(`[POST] Successfully created todo: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers, status: 201 });
    }

    if (req.method === "PUT") {
      // Uncomment for PUT request debugging
      // console.log(`[PUT] Updating todo`);
      
      const body = await req.json();
      const { id, ...updates } = body;
      
      // Uncomment to view update data
      // console.log(`[PUT] Update ID: ${id}, Updates: ${JSON.stringify(updates)}`);

      if (updates.priority) {
        updates.priority = updates.priority.toLowerCase();
        // Uncomment to debug priority normalization
        // console.log(`[PUT] Normalized priority to: ${updates.priority}`);
      }

      if (!id) {
        // Uncomment for validation error debugging
        // console.warn(`[PUT] Missing ID for update`);
        return new Response(JSON.stringify({ error: "Missing ID for update" }), { status: 400, headers });
      }

      const { data, error } = await supabase.from("todos").update(updates).eq("id", id).select();
      
      if (error) {
        // Uncomment to debug update errors
        // console.error(`[PUT] Update error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      // Uncomment to see updated todo
      // console.log(`[PUT] Successfully updated todo: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), { headers });
    }

    if (req.method === "DELETE") {
      // Uncomment for DELETE request debugging
      // console.log(`[DELETE] Deleting todo`);
      
      const body = await req.json();
      const {id} = body;
      
      // Uncomment to view delete ID
      // console.log(`[DELETE] Deleting todo with ID: ${id}`);

      if (!id) {
        // Uncomment for validation error debugging
        // console.warn(`[DELETE] Missing ID for deletion`);
        return new Response(JSON.stringify({error: "Missing ID for deletion"}), {status: 400, headers});
      }

      const {error} = await supabase.from("todos").delete().eq("id", id);
      
      if (error) {
        // Uncomment to debug deletion errors
        // console.error(`[DELETE] Delete error: ${JSON.stringify(error)}`);
        throw error;
      }
      
      // Uncomment to confirm deletion
      // console.log(`[DELETE] Successfully deleted todo with ID: ${id}`);
      return new Response(JSON.stringify({message: "Deleted successfully"}), {headers});
    }

    // Uncomment for method not allowed debugging
    // console.warn(`[Error] Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({error: "Method not allowed"}), {
      status: 405,
      headers,
    });
  } catch (error) {
    // Uncomment for error debugging
    // console.error(`[Error] Unhandled exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({error: errorMessage}), {
      status: 500,
      headers,
    })
  }
});
```
**Viewing Logs in Supabase Dashboard**

To view the console logs from your Edge Functions:

- Log in to your Supabase project dashboard.
- Navigate to the "Edge Functions" section in the left sidebar.
- Select the "todos" function.
- Click on the "Logs" tab to view all console outputs.
- Alternatively, click on the "Invocations" tab to see a history of function calls.

**Benefits of Using Invocations**

The Invocations feature in Supabase Edge Functions provides several benefits for debugging:

- Request History: View a chronological list of all requests made to your function.
- Performance Metrics: See execution time for each request.
- Status Codes: Quickly identify failed requests by their HTTP status codes.
- Request Details: Examine the full request and response details for each invocation.
- Troubleshooting: When something goes wrong, you can match logs with specific invocations to understand what happened.
- Using the Invocations feature alongside console logs provides a comprehensive debugging experience, allowing you to identify issues in your Edge Functions more efficiently.

**Good Programming Practices**

- Code Organization: Keep your code modular and organized for better maintainability.
- Error Handling: The implementation includes comprehensive error handling to manage unexpected scenarios gracefully.
- Security: The API follows best practices for securing endpoints, including input validation.

**Conclusion**

This backend provides a robust foundation for managing tasks in the APA1 Supa Task application. It offers CRUD operations for todos with priority filtering capabilities. By following the guidelines and utilizing the debugging techniques provided, you can effectively develop and troubleshoot your backend services.
