/**
 * Seed script to create a test user
 * Run with: npx tsx --env-file=.env scripts/seed-user.ts
 */

import { auth } from "../lib/auth"

async function seedUser() {
  console.log("Creating user michael@nbsbi.com ...")

  try {
    // Use Better Auth's internal API to create the user
    const result = await auth.api.signUpEmail({
      body: {
        name: "Michael",
        email: "michael@nbsbi.com",
        password: "NBSBI2024!",
      },
    })

    console.log("User created successfully!")
    console.log("Email: michael@nbsbi.com")
    console.log("Password: NBSBI2024!")
    console.log("\nYou can now log in with this account.")
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        console.log("User already exists. You can log in with:")
        console.log("Email: michael@nbsbi.com")
        console.log("Password: NBSBI2024!")
      } else {
        console.error("Error creating user:", error.message)
      }
    } else {
      console.error("Error:", error)
    }
  }

  process.exit(0)
}

seedUser()
