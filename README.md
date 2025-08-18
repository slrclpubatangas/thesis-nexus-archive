# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c7f8480e-1d79-4463-8698-71ecb5aa9bc5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c7f8480e-1d79-4463-8698-71ecb5aa9bc5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step : Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step : Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step : Install the necessary dependencies.
npm install
# Step : Start the development server with auto-reloading and an instant preview.
npm run dev

# Steps to Install the supabase CLI to your project folder
npm install supabase --save-dev
# Step : Run the supabase CLI using npx
npx supabase login
# Step: Run this npx to link your project
npx supabase link --project-ref zummzziydfpvwuxxuyyu

# Step to install sendgrid of email verification
npm install @sendgrid/mail
# Step : Setting your new sendgrid api key
npx supabase secrets set SENDGRID_API_KEY=SG....
# Step : Set Environment Variables
npx supabase secrets set ENVIRONMENT=production

# Steps to deploy edge functions on supabase dashboard
npx supabase functions deploy delete-user
npx supabase functions deploy send-verification-email

```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c7f8480e-1d79-4463-8698-71ecb5aa9bc5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)