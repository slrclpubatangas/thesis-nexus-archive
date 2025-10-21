import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Delete User function up and running!")
console.log("Environment check:")
console.log("PROJECT_URL:", Deno.env.get('PROJECT_URL') ? 'Set' : 'Missing')
console.log("PROJECT_ANON_KEY:", Deno.env.get('PROJECT_ANON_KEY') ? 'Set' : 'Missing')
console.log("PROJECT_SERVICE_KEY:", Deno.env.get('PROJECT_SERVICE_KEY') ? 'Set' : 'Missing')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with the user's auth token for regular operations
    const supabaseUrl = Deno.env.get('PROJECT_URL')
    const supabaseAnonKey = Deno.env.get('PROJECT_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('PROJECT_SERVICE_KEY')

    console.log('Environment variables check:')
    console.log('PROJECT_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('PROJECT_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
    console.log('PROJECT_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing environment variables' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Client for user verification (with user's token)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Admin client for deletion operations (with service role key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the requesting user is authenticated
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the current user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('system_users')
      .select('role, status')
      .eq('user_id', currentUser.id)
      .single()

    if (adminError || !adminCheck || adminCheck.role !== 'Admin' || adminCheck.status !== 'Active') {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the user details before deletion
    const { data: userToDelete, error: fetchError } = await supabase
      .from('system_users')
      .select('user_id, name, email')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prevent self-deletion
    if (userToDelete.user_id === currentUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Attempting to delete user: ${userToDelete.name} (${userToDelete.email})`)

    // Step 1: Delete from system_users table using admin client
    const { error: systemDeleteError } = await supabaseAdmin
      .from('system_users')
      .delete()
      .eq('id', userId)

    if (systemDeleteError) {
      console.error('Error deleting from system_users:', systemDeleteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete user from system: ' + systemDeleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully deleted from system_users table`)

    // Step 2: Delete from auth.users table using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.user_id)

    if (authDeleteError) {
      console.error('Error deleting from auth.users:', authDeleteError)
      
      // Try to restore the system_users record if auth deletion failed
      try {
        await supabaseAdmin
          .from('system_users')
          .insert({
            id: userId,
            user_id: userToDelete.user_id,
            name: userToDelete.name,
            email: userToDelete.email,
            role: 'Reader', // Default role for restoration
            status: 'Inactive' // Mark as inactive since deletion was attempted
          })
        console.log('Restored system_users record after auth deletion failure')
      } catch (restoreError) {
        console.error('Failed to restore system_users record:', restoreError)
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete user from authentication: ' + authDeleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully deleted from auth.users table`)

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${userToDelete.name} has been completely deleted`,
        deletedUser: {
          name: userToDelete.name,
          email: userToDelete.email
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : 'Unknown error')
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
