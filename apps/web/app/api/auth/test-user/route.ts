import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Create a test user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@thesetapp.com',
      password: 'admin123',
      options: {
        data: {
          display_name: 'Admin User'
        }
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Test user created successfully',
      user: data.user,
      instructions: 'You can now sign in with admin@thesetapp.com / admin123'
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 })
  }
} 