using System;
using System.Net.Http;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using JsonApiDotNetCore.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SIL.XForge.DataAccess;
using SIL.XForge.ExceptionLogging;
using SIL.XForge.Identity;
using SIL.XForge.Services;

namespace SIL.XForge.Scripture
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IHostingEnvironment env)
        {
            Configuration = configuration;
            Environment = env;
        }

        public IConfiguration Configuration { get; }
        public IHostingEnvironment Environment { get; }
        public IContainer ApplicationContainer { get; private set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            var containerBuilder = new ContainerBuilder();

            services.AddExceptionLogging();

            services.AddXForgeIdentity();

            services.AddAuthentication()
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                    {
                        if (Environment.IsDevelopment())
                        {
                            options.BackchannelHttpHandler = new HttpClientHandler
                            {
                                ServerCertificateCustomValidationCallback
                                    = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                            };
                        }
                        options.Authority = "https://scriptureforge.local";
                        options.Audience = "api";
                    })
                .AddJwtBearer("localhost", options =>
                    {
                        if (Environment.IsDevelopment())
                        {
                            options.RequireHttpsMetadata = false;
                        }
                        options.Authority = "http://localhost:5000";
                        options.Audience = "api";
                    });

            services.AddMongoDataAccess(Configuration);

            IMvcBuilder mvcBuilder = services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

            services.AddJsonApi(mvcBuilder, containerBuilder);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
                {
                    configuration.RootPath = "ClientApp/dist";
                });

            containerBuilder.Populate(services);

            ApplicationContainer = containerBuilder.Build();
            return new AutofacServiceProvider(ApplicationContainer);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IApplicationLifetime appLifetime)
        {
            app.UseForwardedHeaders(new ForwardedHeadersOptions
                {
                    ForwardedHeaders = ForwardedHeaders.All
                });

            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();
            else
                app.UseExceptionHandler("/Error");

            app.UseBugsnag();

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseIdentityServer();

            app.UseJsonApi();

            app.UseMvc(routes =>
                {
                    routes.MapRoute(
                        name: "default",
                        template: "{controller=Default}/{action=Index}/{id?}");
                });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });

            appLifetime.ApplicationStopped.Register(() => ApplicationContainer.Dispose());
        }
    }
}
