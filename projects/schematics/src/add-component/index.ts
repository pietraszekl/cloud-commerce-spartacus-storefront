import { strings } from '@angular-devkit/core';
import {
  chain,
  externalSchematic,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import {
  findModuleFromOptions,
  getProjectFromWorkspace,
} from '@angular/cdk/schematics';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { Change } from '@schematics/angular/utility/change';
import { ANGULAR_SCHEMATICS, SPARTACUS_CORE } from '../shared/constants';
import {
  commitChanges,
  getPathResultsForFile,
  getTsSourceFile,
  InsertDirection,
} from '../shared/utils/file-utils';
import { importModule } from '../shared/utils/module-file-utils';
import { getWorkspace } from '../shared/utils/workspace-utils';
import { CxCmsComponentSchema } from './schema';

const DELETE_ME = true;

function buildModuleName(options: CxCmsComponentSchema): string {
  const specifiedModule = options.module || '';
  return options.createModule ? options.name : specifiedModule;
}

function print(options: CxCmsComponentSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (DELETE_ME) {
      {
        const moduleName = buildModuleName(options);
        const modulePath = findModuleFromOptions(tree, { name: moduleName });
        if (!modulePath) {
          context.logger.error(`Could not find the ${modulePath}`);
          return;
        }

        const moduleBuffer = tree.read(modulePath);
        if (!moduleBuffer) {
          console.log('no buffer for the module');
          return;
        }

        const moduleContent = moduleBuffer.toString();
        console.log('\n', moduleContent);
      }

      {
        const componentFileName = `${strings.camelize(
          options.name
        )}.${strings.camelize(options.type)}.ts`;
        const possibleProjectFiles = ['/angular.json', '/.angular.json'];
        const { workspace } = getWorkspace(tree, possibleProjectFiles);
        const project = getProjectFromWorkspace(workspace, options.project);

        const componentPath = getPathResultsForFile(
          tree,
          componentFileName,
          project.sourceRoot
        )[0];
        console.log('component path', componentPath);

        const componentBuffer = tree.read(componentPath);
        if (!componentBuffer) {
          console.log('no buffer for the component');
          return;
        }

        const componentContent = componentBuffer.toString();
        console.log('\n', componentContent);
      }
    }
  };
}

function updateModule(options: CxCmsComponentSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const moduleName = buildModuleName(options);
    const modulePath = findModuleFromOptions(tree, { name: moduleName });
    if (!modulePath) {
      context.logger.error(`Could not find the ${modulePath}`);
      return;
    }

    const changes: Change[] = [];

    const moduleTs = getTsSourceFile(tree, modulePath);
    const insertImportChange = insertImport(
      moduleTs,
      modulePath,
      'ConfigModule, CmsConfig',
      SPARTACUS_CORE,
      false
    );
    changes.push(insertImportChange);

    // TODO:#12 - if createModule option is false, then try to add the component to the CMS config
    const componentName = `${strings.classify(options.name)}${options.type}`;
    const insertModuleChanges = importModule(
      tree,
      modulePath,
      `ConfigModule.withConfig(<CmsConfig>{
      cmsComponents: {
        ${componentName}: {
          component: ${componentName},
        },
      },
    }),`
    );
    changes.push(...insertModuleChanges);

    commitChanges(tree, modulePath, changes, InsertDirection.RIGHT);
  };
}

function updateComponent(options: CxCmsComponentSchema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const componentFileName = `${strings.camelize(
      options.name
    )}.${strings.camelize(options.type)}.ts`;

    const possibleProjectFiles = ['/angular.json', '/.angular.json'];
    const { workspace } = getWorkspace(tree, possibleProjectFiles);
    const project = getProjectFromWorkspace(workspace, options.project);

    const componentPath = getPathResultsForFile(
      tree,
      componentFileName,
      project.sourceRoot
    )[0];

    if (DELETE_ME) {
      console.log('*** options, keep an eye to path ***', options);
      console.log('*** looking for a component ***', componentFileName);
      console.log('*** component path ***', componentPath);
    }
  };
}

function validateArguments(options: CxCmsComponentSchema): void {
  if (!options.createModule && !Boolean(options.module)) {
    throw new SchematicsException(
      'You have to either specify a path to an existing module or set "createModule" to true.'
    );
  }
}

export function addComponent(options: CxCmsComponentSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    validateArguments(options);

    const changeDetection = options.changeDetection;
    const createModule = options.createModule;
    const entryComponent = options.entryComponent;
    const exportOption = options.export;
    const flat = options.flat;
    const inlineStyle = options.inlineStyle;
    const inlineTemplate = options.inlineTemplate;
    const lintFix = options.lintFix;
    const moduleName = buildModuleName(options);
    const componentName = options.name;
    const prefix = options.prefix;
    const project = options.project;
    const selector = options.selector;
    const skipSelector = options.skipSelector;
    const type = options.type;
    const skipTests = options.skipTests;
    const style = options.style;
    const viewEncapsulation = options.viewEncapsulation;

    return chain([
      createModule
        ? externalSchematic(ANGULAR_SCHEMATICS, 'module', {
            project,
            name: moduleName,
          })
        : noop(),
      externalSchematic(ANGULAR_SCHEMATICS, 'component', {
        changeDetection,
        entryComponent,
        export: exportOption,
        flat,
        inlineStyle,
        inlineTemplate,
        lintFix,
        module: moduleName,
        name: componentName,
        prefix,
        project,
        selector,
        skipSelector,
        type,
        skipTests,
        style,
        viewEncapsulation,
      }),
      updateModule(options),
      updateComponent(options),
      print(options),
    ])(tree, context);
  };
}
