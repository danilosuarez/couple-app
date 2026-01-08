import { getAccounts } from "@/app/actions/accounts";
import AccountsClient from "./client";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const accounts = await getAccounts();

    return <AccountsClient accounts={accounts} />;
}
