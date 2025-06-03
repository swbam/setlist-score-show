import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { Logo } from '@/components/ui/logo'

export const metadata: Metadata = {
  title: 'Sign Up | Setlist Score Show',
  description: 'Create an account to start voting on concert setlists',
}

export default async function SignUpPage() {
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
          <h2 className="text-3xl font-bold mb-2">Create your account</h2>
          <p className="text-gray-400">
            Join thousands of fans voting on their favorite songs
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <SignUpForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="block w-full text-center py-3 px-4 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Sign in instead
          </Link>
        </div>

        {/* Terms and Privacy */}
        <p className="text-center text-xs text-gray-400">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-teal-400 hover:text-teal-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-teal-400 hover:text-teal-300">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}