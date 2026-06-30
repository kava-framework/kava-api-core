import fs from "fs";
import path from "path";
import { Command } from "commander";

// Helper to recursively find files with specific extensions
function getFiles(dir: string, extList: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        results = results.concat(getFiles(filePath, extList));
      }
    } else {
      if (extList.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

// Simple parser for object literal string (e.g. c.validation block)
function parseObjectLiteral(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Strip single-line and multi-line comments
  const cleanStr = str
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  
  // Regex to match key: value
  const regex = /(?:(\w+)|["']([^"']+)["'])\s*:\s*([^,}\n]+)/g;
  let match;
  while ((match = regex.exec(cleanStr)) !== null) {
    const key = match[1] || match[2];
    const val = match[3].trim().replace(/['"\[\]]/g, "").replace(/\s+/g, " ");
    result[key] = val;
  }
  return result;
}

interface RouteInfo {
  method: string;
  path: string;
  controllerName: string;
  methodName: string;
  routesFile: string; // e.g. "base.routes.ts" or "admin.routes.ts"
}

interface ModelField {
  name: string;
  type: string;
  decorators: string[]; // e.g. ["fillable", "selectable", "searchable"]
}

interface ModelRelation {
  name: string;
  type: string; // e.g. "HasMany", "BelongsTo", "HasOne"
  targetModel: string;
}

interface ModelInfo {
  name: string;
  fields: ModelField[];
  relations: ModelRelation[];
}

interface ControllerMethodInfo {
  methodName: string;
  isMagicResolve: boolean;
  isMagicPump: boolean;
  validationModel?: string;
  validationRules: Record<string, string>;
  customQueryParams: string[];
  customPayloadFields: string[];
}

interface ControllerInfo {
  name: string;
  methods: Record<string, ControllerMethodInfo>;
}

export const generateDocsCommand = new Command("generate:docs")
  .description("Generate API Markdown documentation from routes, controllers, and models")
  .option("-p, --path <path>", "Filter by specific route path (e.g. --path=/users)")
  .action(async (options) => {
    const projectRoot = process.cwd();
    const filterPath = options.path;

    console.log(`🔍 Scanning project in: ${projectRoot}`);
    if (filterPath) {
      console.log(`Filter path: ${filterPath}`);
    }

    // 1. Parse Models
    const modelFiles = getFiles(path.join(projectRoot, "app", "models"), [".ts"]);
    const models: Record<string, ModelInfo> = {};

    for (const file of modelFiles) {
      const content = fs.readFileSync(file, "utf8");
      // Find class User extends Model
      const classMatch = /class\s+(\w+)\s+extends\s+Model/g.exec(content);
      if (!classMatch) continue;
      const modelName = classMatch[1];

      const fields: ModelField[] = [];
      const relations: ModelRelation[] = [];

      // Parse fields: @Field(["fillable", "selectable", "searchable"]) name!: string
      const fieldRegex = /@Field\(\s*\[([\s\S]*?)\]\s*\)\s*(\w+)\s*!?:?\s*(\w+)/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(content)) !== null) {
        const decorators = fieldMatch[1]
          .split(",")
          .map((d) => d.trim().replace(/['"]/g, ""))
          .filter(Boolean);
        fields.push({
          name: fieldMatch[2],
          type: fieldMatch[3],
          decorators,
        });
      }

      // Parse relations: @HasMany(() => Role, "user_id") roles!: Role[]
      const relationRegex = /@(HasMany|HasOne|BelongsTo)\(\s*\(\s*\)\s*=>\s*(\w+)[^]*?\)\s*(\w+)/g;
      let relationMatch;
      while ((relationMatch = relationRegex.exec(content)) !== null) {
        relations.push({
          type: relationMatch[1],
          targetModel: relationMatch[2],
          name: relationMatch[3],
        });
      }

      models[modelName] = {
        name: modelName,
        fields,
        relations,
      };
    }

    // 2. Parse Controllers
    const controllerFiles = getFiles(path.join(projectRoot, "app", "controllers"), [".ts"]);
    const controllers: Record<string, ControllerInfo> = {};

    for (const file of controllerFiles) {
      const content = fs.readFileSync(file, "utf8");
      const classMatch = /class\s+(\w+)/g.exec(content);
      if (!classMatch) continue;
      const controllerName = classMatch[1];

      const methods: Record<string, ControllerMethodInfo> = {};

      // Simple method splitter by looking for static async or static methods
      const methodRegex = /static\s+(?:async\s+)?(\w+)\s*\(\s*c\s*:\s*(\w+|any)\s*\)\s*\{([\s\S]*?)(?=\s+static|\s+\/\/|\s*\}\s*$)/g;
      let methodMatch;
      while ((methodMatch = methodRegex.exec(content)) !== null) {
        const methodName = methodMatch[1];
        const body = methodMatch[3];

        const isMagicResolve = body.includes(".resolve(c)");
        const isMagicPump = body.includes(".pump(");

        // Parse c.validation<ModelName>({ ... })
        let validationModel: string | undefined;
        let validationRules: Record<string, string> = {};
        const valRegex = /c\.validation(?:<(\w+)>)?\(\s*(\{[\s\S]*?\})\s*\)/g;
        const valMatch = valRegex.exec(body);
        if (valMatch) {
          validationModel = valMatch[1];
          validationRules = parseObjectLiteral(valMatch[2]);
        }

        // Parse custom query parameters: c.getQuery.field, c.query.field, or destructuring
        const customQueryParams: string[] = [];
        const queryFieldRegex = /\bc\.(?:getQuery|query)\.(\w+)\b/g;
        let qfMatch;
        while ((qfMatch = queryFieldRegex.exec(body)) !== null) {
          customQueryParams.push(qfMatch[1]);
        }
        // Destructuring: const { a, b } = c.getQuery
        const queryDestructRegex = /const\s*\{\s*([\w\s,]+)\s*\}\s*=\s*c\.(?:getQuery|query)/g;
        let qdMatch;
        while ((qdMatch = queryDestructRegex.exec(body)) !== null) {
          qdMatch[1].split(",").forEach((p) => {
            const trimmed = p.trim();
            if (trimmed) customQueryParams.push(trimmed);
          });
        }

        // Parse custom payload fields: c.payload.field, c.body.field, or destructuring
        const customPayloadFields: string[] = [];
        const payloadFieldRegex = /\bc\.(?:payload|body)\.(\w+)\b/g;
        let pfMatch;
        while ((pfMatch = payloadFieldRegex.exec(body)) !== null) {
          customPayloadFields.push(pfMatch[1]);
        }
        const payloadDestructRegex = /const\s*\{\s*([\w\s,]+)\s*\}\s*=\s*c\.(?:payload|body)/g;
        let pdMatch;
        while ((pdMatch = payloadDestructRegex.exec(body)) !== null) {
          pdMatch[1].split(",").forEach((p) => {
            const trimmed = p.trim();
            if (trimmed) customPayloadFields.push(trimmed);
          });
        }

        methods[methodName] = {
          methodName,
          isMagicResolve,
          isMagicPump,
          validationModel,
          validationRules,
          customQueryParams: Array.from(new Set(customQueryParams)),
          customPayloadFields: Array.from(new Set(customPayloadFields)),
        };
      }

      controllers[controllerName] = {
        name: controllerName,
        methods,
      };
    }

    // 3. Parse Routes
    const routeFiles = getFiles(path.join(projectRoot, "app", "routes"), [".ts"]);
    const routesList: RouteInfo[] = [];

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, "utf8");
      const filename = path.basename(file);

      // We want to find Elysia route registrations and api() helper registrations
      // Group: app.group('/api', (route) => { ... })
      // Let's capture the group path
      const groupRegex = /\.group\(\s*['"]([^'"]+)['"]/g;
      let groupPrefix = "";
      const groupMatch = groupRegex.exec(content);
      if (groupMatch) {
        groupPrefix = groupMatch[1]; // e.g. "/api"
      }

      // 1. Standard routes: route.get('/path', Controller.method)
      const routeRegex = /route\.(\w+)\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\.(\w+)\)/g;
      let rMatch;
      while ((rMatch = routeRegex.exec(content)) !== null) {
        routesList.push({
          method: rMatch[1].toUpperCase(),
          path: `${groupPrefix}${rMatch[2]}`.replace(/\/+/g, "/"),
          controllerName: rMatch[3],
          methodName: rMatch[4],
          routesFile: filename,
        });
      }

      // 2. Resource routes: api(route, "/users", UserController)
      const resourceRegex = /api\(\s*\w+\s*,\s*['"]([^'"]+)['"]\s*,\s*(\w+)\)/g;
      let resMatch;
      while ((resMatch = resourceRegex.exec(content)) !== null) {
        const basePath = `${groupPrefix}${resMatch[1]}`.replace(/\/+/g, "/");
        const controllerName = resMatch[2];

        // Standard RESTful mappings for api()
        const resourceMethods = [
          { method: "GET", path: basePath, methodName: "index" },
          { method: "POST", path: basePath, methodName: "store" },
          { method: "PUT", path: `${basePath}/:id`.replace(/\/+/g, "/"), methodName: "update" },
          { method: "DELETE", path: `${basePath}/:id`.replace(/\/+/g, "/"), methodName: "destroy" },
        ];

        for (const rm of resourceMethods) {
          routesList.push({
            method: rm.method,
            path: rm.path,
            controllerName,
            methodName: rm.methodName,
            routesFile: filename,
          });
        }
      }
    }

    // 4. Generate Markdown Documentation
    let generatedCount = 0;
    const docsDir = path.join(projectRoot, "docs");

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    for (const route of routesList) {
      const fullPath = route.path;

      // Filter by path if requested
      if (filterPath && !fullPath.startsWith(filterPath)) {
        continue;
      }

      const controller = controllers[route.controllerName];
      if (!controller) continue;

      const methodInfo = controller.methods[route.methodName];
      if (!methodInfo) continue;

      // Find associated model
      // First check if validation specified a model, otherwise guess from controller name or model usages
      let modelName = methodInfo.validationModel;
      if (!modelName) {
        // Guess from controller name (e.g., UserController -> User)
        const guessed = route.controllerName.replace("Controller", "");
        if (models[guessed]) {
          modelName = guessed;
        }
      }

      const model = modelName ? models[modelName] : undefined;

      // Determine output directory based on routes file and path
      // If routesFile is not "base.routes.ts", prefix folder with routesFile prefix (e.g. admin.routes.ts -> admin)
      let modulePrefix = "";
      if (route.routesFile !== "base.routes.ts") {
        modulePrefix = route.routesFile.replace(".routes.ts", "");
      }

      // First path segment after the group/api prefix
      const cleanPath = fullPath.replace(/^\/(api|v1)\//, "").replace(/^\//, "");
      const firstSegment = cleanPath.split("/")[0] || "general";

      const targetFolder = modulePrefix 
        ? path.join(docsDir, modulePrefix, firstSegment)
        : path.join(docsDir, firstSegment);

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      // File Naming: [METHOD]_[SAFE_PATH].md
      // Replace :param with [param], and other unsafe chars with _
      const safePathName = fullPath
        .replace(/:(\w+)/g, "[$1]") // replace :id with [id]
        .replace(/^\//, "")
        .replace(/\/+/g, "_"); // replace slashes with underscore
      
      const fileName = `${route.method}_${safePathName}.md`;
      const filePath = path.join(targetFolder, fileName);

      // Start building Markdown content
      let md = `# ${route.method} ${fullPath}\n\n`;
      md += `*   **Controller**: \`${route.controllerName}.${route.methodName}\`\n`;
      if (model) {
        md += `*   **Model**: \`${model.name}\`\n`;
      }
      md += `*   **Features**: ${
        [
          methodInfo.isMagicResolve ? "**[Magic Resolve]**" : "",
          methodInfo.isMagicPump ? "**[Magic Pump]**" : "",
        ]
          .filter(Boolean)
          .join(", ") || "None"
      }\n\n`;

      // 1. Headers Table (Only if GET and supports option mode, or custom headers)
      if (route.method === "GET" && methodInfo.isMagicResolve) {
        md += `## Request Headers (Optional)\n\n`;
        md += `| Key | Example Value |\n`;
        md += `| :--- | :--- |\n`;
        md += `| \`x-option\` | \`"true"\` |\n\n`;
      }

      // 2. Query Parameters Table
      const queryParams: Array<{ key: string; example: string; desc: string }> = [];
      if (route.method === "GET" && methodInfo.isMagicResolve) {
        queryParams.push(
          { key: "isOption", example: "true", desc: "Alternative to activate **Dropdown/Option Mode**." },
          { key: "option[]", example: '["id", "name"]', desc: "Customizes the columns mapped to `value` and `label` in Option Mode." },
          { key: "page", example: "1", desc: "The page number for pagination." },
          { key: "paginate", example: "15", desc: "Number of records per page." },
          { key: "search", example: '"john"', desc: "Performs a global search across `searchable` fields in the model." },
          { key: "filter[column]", example: '"active"', desc: "Filters records by a specific column value." }
        );

        // Add expandable relations
        if (model && model.relations.length > 0) {
          const relationNames = model.relations.map((r) => `\`"${r.name}"\``).join(", ");
          queryParams.push({
            key: "expand",
            example: `"${model.relations[0].name}"`,
            desc: `Eager-loads related models. Available relations: ${relationNames}. Can also be passed as \`expand[]\`.`,
          });
        }

        queryParams.push({ key: "sort", example: '"-created_at"', desc: "Sorts by a column. Prefix with `-` for descending order." });
      }

      // Add custom query parameters found in controller
      for (const customQ of methodInfo.customQueryParams) {
        // Skip if already in standard params
        if (["page", "paginate", "search", "filter", "expand", "sort", "isOption", "option"].includes(customQ)) continue;
        queryParams.push({
          key: customQ,
          example: `"value"`,
          desc: "Custom query parameter extracted from controller logic.",
        });
      }

      if (queryParams.length > 0) {
        md += `## Query Parameters\n\n`;
        md += `| Key | Example Value |\n`;
        md += `| :--- | :--- |\n`;
        for (const q of queryParams) {
          md += `| \`${q.key}\` | \`${q.example}\` |\n`;
        }
        md += `\n`;
      }

      // 3. Payload Table (For POST/PUT/PATCH)
      if (["POST", "PUT", "PATCH"].includes(route.method)) {
        md += `## Payload (JSON Body)\n\n`;
        md += `| Key | Example Value | Required | Validation |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;

        const payloadFieldsSet = new Set<string>();

        // First add fields from validation rules
        for (const [field, rule] of Object.entries(methodInfo.validationRules)) {
          payloadFieldsSet.add(field);
          const isRequired = rule.includes("required") ? "Yes" : "No";
          md += `| \`${field}\` | \`""\` | ${isRequired} | \`${rule}\` |\n`;
        }

        // Add other fillable fields from Model if not already in validation
        if (model) {
          for (const f of model.fields) {
            if (f.decorators.includes("fillable") && !payloadFieldsSet.has(f.name)) {
              payloadFieldsSet.add(f.name);
              md += `| \`${f.name}\` | \`""\` | No | \`None\` |\n`;
            }
          }

          // Add pumpable relations
          if (methodInfo.isMagicPump) {
            for (const r of model.relations) {
              if (!payloadFieldsSet.has(r.name)) {
                payloadFieldsSet.add(r.name);
                const isArray = r.type === "HasMany" ? "[]" : "";
                md += `| \`${r.name}\` | \`${r.type === "HasMany" ? "[]" : "{}"}\` | No | \`Relation (${r.type})\` |\n`;
              }
            }
          }
        }

        // Add custom payload fields found in controller
        for (const customP of methodInfo.customPayloadFields) {
          if (!payloadFieldsSet.has(customP)) {
            payloadFieldsSet.add(customP);
            md += `| \`${customP}\` | \`""\` | No | \`Custom\` |\n`;
          }
        }
        md += `\n`;
      }

      // 4. Response Table
      md += `## Response\n\n`;
      md += `| Key | Example Result |\n`;
      md += `| :--- | :--- |\n`;

      if (route.method === "GET" && methodInfo.isMagicResolve) {
        md += `| \`data\` | \`[]\` |\n`;
        md += `| \`total\` | \`0\` |\n`;
      } else if (model) {
        // Show selectable fields of the model
        for (const f of model.fields) {
          if (f.decorators.includes("selectable")) {
            let exampleVal = `""`;
            if (f.type === "number") exampleVal = `0`;
            else if (f.type === "boolean") exampleVal = `true`;
            else if (f.type === "Date") exampleVal = `"${new Date().toISOString()}"`;

            md += `| \`${f.name}\` | \`${exampleVal}\` |\n`;
          }
        }
      } else {
        md += `| \`success\` | \`true\` |\n`;
      }
      md += `\n`;

      fs.writeFileSync(filePath, md, "utf8");
      console.log(`Generated: docs/${path.relative(docsDir, filePath)}`);
      generatedCount++;
    }

    console.log(`🎉 API Documentation generated successfully! Total files: ${generatedCount}`);
  });
