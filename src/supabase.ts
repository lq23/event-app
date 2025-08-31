// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ypcmhvgkpthzqqfzjsbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwY21odmdrcHRoenFxZnpqc2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MzkwMjUsImV4cCI6MjA2NjIxNTAyNX0.yTkQh0atH-LIHRzIl4qD3vUUk9va0N9JOAq0S87oi3c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
