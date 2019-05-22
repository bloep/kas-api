import { createHash } from "crypto";
import { createClientAsync } from "soap";
import { parseString } from "xml2js";
import { APIResultTransformer } from "./api-result-transformer";

type APIFunction =
    "add_account" | "delete_account" | "get_accountressources" | "get_accounts" | "get_accountsettings"
        | "get_server_information" | "update_account" | "update_accountsettings" | "update_superusersettings" |
    "update_chown" |
    "add_cronjob" | "delete_cronjob" | "get_cronjobs" | "update_cronjob" |
    "add_database" | "delete_database" | "get_databases" | "update_database" |
    "add_ddnsuser" | "delete_ddnsuser" | "get_ddnsusers" | "update_ddnsuser" |
    "add_directoryprotection" | "delete_directoryprotection" | "get_directoryprotection"
        | "update_directoryprotection" |
    "add_dkim" | "delete_dkim" | "get_dkim" |
    "add_dns_settings" | "delete_dns_settings" | "get_dns_settings" | "reset_dns_settings" | "update_dns_settings" |
    "add_domain" | "delete_domain" | "get_domains" | "get_topleveldomains" | "move_domain" | "update_domain" |
    "add_ftpusers" | "delete_ftpuser" | "get_ftpusers" | "update_ftpuser" |
    "add_mailaccount" | "delete_mailaccount" | "get_mailaccounts" | "update_mailaccount" |
    "add_mailstandardfilter" | "delete_mailstandardfilter" | "update_mailstandardfilter" |
    "add_mailforward" | "delete_mailforward" | "get_mailforwards" | "update_mailforward" |
    "add_mailinglist" | "delete_mailinglist" | "get_mailinglists" | "update_mailinglist" |
    "add_sambauser" | "delete_sambauser" | "get_sambausers" | "update_sambauser" |
    "add_session" |
    "add_softwareinstall" | "get_softwareinstall" |
    "update_ssl" |
    "get_space" | "get_space_usage" | "get_traffic" |
    "add_subdomain" | "delete_subdomain" | "get_subdomains" | "update_subdomain" |
    "add_symlink";

export class KasApi {
    private static endpoint = "https://kasapi.kasserver.com/soap/wsdl/KasApi.wsdl";

    private readonly account: string;
    private readonly password: string;

    constructor(account: string, password: string) {
        this.account = account;
        this.password = password;
    }

    public async call(action: APIFunction, data?: object) {
        const soapClient = await createClientAsync(KasApi.endpoint, {
            disableCache: true,
            // @ts-ignore
            suppressStack: true,
        });

        const hash = createHash("sha1")
            .update(this.password)
            .digest("hex");

        const payload = JSON.stringify({
            KasAuthData: hash,
            KasAuthType: "sha1",
            KasRequestParams: data || {},
            KasRequestType: action,
            KasUser: this.account,
        });

        let response: any[];
        try {
            // @ts-ignore
            response = await soapClient.KasApiAsync({params: payload});
        } catch (e) {
            return e;
        }

        const jsonResponse = await new Promise((res, rej) => {
            parseString(response[1], {
                async: true,
                explicitArray: false,
                ignoreAttrs: true,
                mergeAttrs: true,
                trim: true,
            }, (err, result) => {
                if (err) {
                    rej(err);
                }
                res(result);
            });
        });

        const parsedResponse = APIResultTransformer.transform(jsonResponse);

        // @ts-ignore
        if (parsedResponse.Response.ReturnString !== "TRUE") {
            throw new Error("Request wasn't successful.");
        }

        // @ts-ignore
        return parsedResponse.Response.ReturnInfo;
    }
}
