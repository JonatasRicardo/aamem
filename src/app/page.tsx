import { CreateYourOwnHomeFlow } from "@/components/templates/create-your-own-home-flow";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const currentUser = await getCurrentUser();

  return (
    <CreateYourOwnHomeFlow
      currentUser={
        currentUser
          ? {
              name: currentUser.name,
              email: currentUser.email,
            }
          : null
      }
    />
  );
}
