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

  try {
    if (req.method === "GET") {
      let query = supabase.from("todos").select("*").order("created_at", {ascending: false});

      if (priority) {
        query = query.eq("priority", priority);
      }

      const {data, error} = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data), {headers});
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { todo, priority = "low" } = body;

      const { data, error } = await supabase
          .from("todos")
          .insert([{ todo, priority }])
          .select();

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers, status: 201 });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (updates.priority) {
        updates.priority = updates.priority.toLowerCase();
      }

      // console.log("Updating with data:", updates);

      if (!id) {
        return new Response(JSON.stringify({ error: "Missing ID for update" }), { status: 400, headers });
      }

      const { data, error } = await supabase.from("todos").update(updates).eq("id", id).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    if (req.method === "DELETE") {
      const body = await req.json();
      const {id} = body;

      if (!id) {
        return new Response(JSON.stringify({error: "Missing ID for deletion"}), {status: 400, headers});
      }

      const {error} = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({message: "Deleted successfully"}), {headers});
    }

    return new Response(JSON.stringify({error: "Method not allowed"}), {
      status: 405,
      headers,
    });
  } catch (error) {
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({error: errorMessage}), {
      status: 500,
      headers,
    })
  }
});