using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using IdentityModel;
using IdentityServer4;
using IdentityServer4.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SIL.XForge.Configuration;
using SIL.XForge.Identity.Services;

namespace SIL.XForge.Identity
{
    public static class XFIdentityServiceCollectionExtensions
    {
        private static readonly List<IdentityResource> IdentityResources = new List<IdentityResource>
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Email(),
            new IdentityResources.Profile()
        };

        private static readonly List<ApiResource> ApiResources = new List<ApiResource>
        {
            new ApiResource("api", "Web API")
            {
                UserClaims = { JwtClaimTypes.Role, "site_role" }
            }
        };

        private static Client XFClient(string domain)
        {
            return new Client
            {
                ClientId = "xForge",
                AllowedGrantTypes = GrantTypes.Implicit,
                AllowAccessTokensViaBrowser = true,
                AlwaysIncludeUserClaimsInIdToken = true,
                AccessTokenType = AccessTokenType.Jwt,
                RequireConsent = false,
                RedirectUris =
                {
                    $"https://{domain}/home",
                    $"https://{domain}/silent-refresh.html"
                },
                PostLogoutRedirectUris =
                {
                    $"https://{domain}/"
                },
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Email,
                    IdentityServerConstants.StandardScopes.Profile,
                    "api"
                }
            };
        }

        public static IServiceCollection AddXFIdentityServer(this IServiceCollection services,
            IConfiguration configuration)
        {
            services.ConfigureOptions<StaticFilesConfigureOptions>();

            var siteOptions = configuration.GetOptions<SiteOptions>();
            var dataAccessOptions = configuration.GetOptions<DataAccessOptions>();

            IIdentityServerBuilder builder = services.AddIdentityServer()
                .AddValidationKeys()
                .AddInMemoryIdentityResources(IdentityResources)
                .AddInMemoryApiResources(ApiResources)
                .AddInMemoryClients(new[] { XFClient(siteOptions.Domain) })
                .AddProfileService<UserProfileService>()
                .AddResourceOwnerValidator<UserResourceOwnerPasswordValidator>()
                .AddOperationalStore(options =>
                    {
                        options.ConnectionString = dataAccessOptions.ConnectionString;
                        options.Database = dataAccessOptions.MongoDatabaseName;
                    });

            IConfigurationSection securityConfig = configuration.GetSection("Security");
            bool useDeveloperCredential = securityConfig.GetValue("UseDeveloperSigningCredential", false);
            string certFileName = securityConfig.GetValue<string>("SigningCredential");
            if (useDeveloperCredential)
            {
                builder.AddDeveloperSigningCredential();
            }
            else
            {
                var cert = new X509Certificate2(certFileName);
                builder.AddSigningCredential(cert);
            }

            return services;
        }
    }
}
