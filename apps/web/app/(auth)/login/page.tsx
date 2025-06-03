import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/ui/logo'

export const metadata: Metadata = {
  title: 'Login | Setlist Score Show',
  description: 'Sign in to vote on your favorite songs',
}

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect if already logged in
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <Logo className="h-12 w-auto mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-gray-400">
            Sign in to continue voting on your favorite songs
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <LoginForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                New to Setlist Score Show?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="block w-full text-center py-3 px-4 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Create an account
          </Link>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-400">
          <Link href="/forgot-password" className="hover:text-white transition-colors">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  )
}