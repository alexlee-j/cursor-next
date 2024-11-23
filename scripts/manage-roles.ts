import {
  promoteToSuperAdmin,
  promoteToAdmin,
  demoteToUser,
} from "../lib/user-roles";

async function main() {
  const [action, userEmail] = process.argv.slice(2);

  if (!action || !userEmail) {
    console.error(
      "Usage: npm run manage-roles [promote-admin|promote-super|demote] <user-email>"
    );
    process.exit(1);
  }

  try {
    switch (action) {
      case "promote-super":
        await promoteToSuperAdmin(userEmail);
        console.log(`Promoted ${userEmail} to super admin`);
        break;
      case "promote-admin":
        await promoteToAdmin(userEmail);
        console.log(`Promoted ${userEmail} to admin`);
        break;
      case "demote":
        await demoteToUser(userEmail);
        console.log(`Demoted ${userEmail} to regular user`);
        break;
      default:
        console.error("Invalid action");
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
