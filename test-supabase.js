import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log("Testing Supabase Connection...");
  
  // 1. Fetch
  console.log("Fetching posts...");
  const { data: fetchResult, error: fetchError } = await supabase.from('posts').select('*').limit(1);
  
  if (fetchError) {
    console.error("Fetch Error:", fetchError);
  } else {
    console.log("Fetch Success, posts found:", fetchResult.length);
  }

  // 2. Insert (We'll insert a dummy and delete it immediately, or just log success if RLS allows)
  console.log("Inserting a test post...");
  const { data: insertResult, error: insertError } = await supabase.from('posts').insert([{
    title: "Test Connection",
    source: "System",
    summary: "Testing",
    opinion: "Looks good",
    category: "AI",
    tags: ["Test"],
    author: "다연"
  }]).select().single();

  if (insertError) {
    console.error("Insert Error:", insertError);
  } else {
    console.log("Insert Success! Post ID:", insertResult.id);
    
    // 3. Delete
    console.log("Deleting test post...");
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', insertResult.id);
    if (deleteError) {
      console.error("Delete Error:", deleteError);
    } else {
      console.log("Delete Success!");
    }
  }
}

testSupabase();
