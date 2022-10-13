import {
  CodeDeploy,
  ApplicationInfo,
  paginateListApplications,
  CreateApplicationCommandInput,
  paginateListApplicationRevisions,
  RegisterApplicationRevisionCommandInput,
} from '@aws-sdk/client-codedeploy';

import { AwsCodedeployModule } from '..';
import { AWS, crudBuilder2, crudBuilderFormat, paginateBuilder } from '../../../../services/aws_macros';
import { Context, Crud2, MapperBase } from '../../../interfaces';
import { CodedeployApplication, ComputePlatform, RevisionType } from '../entity';

export class CodedeployApplicationMapper extends MapperBase<CodedeployApplication> {
  module: AwsCodedeployModule;
  entity = CodedeployApplication;
  equals = (a: CodedeployApplication, b: CodedeployApplication) =>
    Object.is(a.name, b.name) &&
    Object.is(a.computePlatform, b.computePlatform) &&
    Object.is(a.applicationId, b.applicationId);

  async applicationMapper(app: ApplicationInfo, ctx: Context) {
    const client = (await ctx.getAwsClient()) as AWS;
    const out = new CodedeployApplication();
    if (!app.applicationName) return undefined;
    out.name = app.applicationName;
    out.applicationId = app.applicationId;
    out.computePlatform = (app.computePlatform as ComputePlatform) ?? ComputePlatform.Server;

    return out;
  }

  createApplication = crudBuilderFormat<CodeDeploy, 'createApplication', string | undefined>(
    'createApplication',
    input => input,
    res => res?.applicationId,
  );

  createRevision = crudBuilderFormat<CodeDeploy, 'registerApplicationRevision', null>(
    'registerApplicationRevision',
    input => input,
    res => null,
  );

  getApplication = crudBuilderFormat<CodeDeploy, 'getApplication', ApplicationInfo | undefined>(
    'getApplication',
    input => input,
    res => res?.application,
  );

  listApplications = paginateBuilder<CodeDeploy>(paginateListApplications, 'applications');

  deleteApplication = crudBuilder2<CodeDeploy, 'deleteApplication'>('deleteApplication', input => input);

  cloud: Crud2<CodedeployApplication> = new Crud2({
    create: async (es: CodedeployApplication[], ctx: Context) => {
      const client = (await ctx.getAwsClient()) as AWS;
      const out = [];
      for (const e of es) {
        const input: CreateApplicationCommandInput = {
          applicationName: e.name,
          computePlatform: ComputePlatform[e.computePlatform],
        };
        const appId = await this.createApplication(client.cdClient, input);
        if (!appId) continue;

        // we just need to add the id
        e.applicationId = appId;
        await this.db.update(e, ctx);

        out.push(e);
      }
      return out;
    },
    read: async (ctx: Context, name?: string) => {
      const client = (await ctx.getAwsClient()) as AWS;
      if (name) {
        const rawApp = await this.getApplication(client.cdClient, { applicationName: name });
        if (!rawApp) return;

        // map to entity
        const app = await this.applicationMapper(rawApp, ctx);
        return app;
      } else {
        const out = [];
        const appNames = await this.listApplications(client.cdClient);
        if (!appNames || !appNames.length) return;
        for (const appName of appNames) {
          const rawApp = await this.getApplication(client.cdClient, { applicationName: appName });
          if (!rawApp) continue;

          const app = await this.applicationMapper(rawApp, ctx);
          if (app) out.push(app);
        }
        return out;
      }
    },
    updateOrReplace: (a: CodedeployApplication, b: CodedeployApplication) => 'replace',
    update: async (apps: CodedeployApplication[], ctx: Context) => {
      const client = (await ctx.getAwsClient()) as AWS;
      const out = [];

      for (const app of apps) {
        // delete app and create new one
        await this.module.application.cloud.delete(app, ctx);
        const appId = await this.module.application.cloud.create(app, ctx);
        if (!appId) continue;

        // retrieve app details
        const createdApp = await this.module.application.cloud.read(ctx, app.name);
        if (createdApp) out.push(createdApp);
      }
      return out;
    },
    delete: async (apps: CodedeployApplication[], ctx: Context) => {
      const client = (await ctx.getAwsClient()) as AWS;
      for (const app of apps) {
        await this.deleteApplication(client.cdClient, { applicationName: app.name });
      }
    },
  });

  constructor(module: AwsCodedeployModule) {
    super();
    this.module = module;
    super.init();
  }
}