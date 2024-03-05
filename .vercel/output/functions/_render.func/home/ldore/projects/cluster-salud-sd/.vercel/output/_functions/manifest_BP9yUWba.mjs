import { $ as bold, a0 as red, a1 as yellow, a2 as dim, a3 as blue } from './chunks/astro_uNdN2VWs.mjs';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return red(prefix.join(" "));
  }
  if (level === "warn") {
    return yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return dim(prefix[0]);
  }
  return dim(prefix[0]) + " " + blue(prefix.splice(1).join(" "));
}
if (typeof process !== "undefined") {
  let proc = process;
  if ("argv" in proc && Array.isArray(proc.argv)) {
    if (proc.argv.includes("--verbose")) ; else if (proc.argv.includes("--silent")) ; else ;
  }
}
class Logger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
}

/**
 * Tokenize input string.
 */
function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
        if (char === "\\") {
            tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
            continue;
        }
        if (char === "{") {
            tokens.push({ type: "OPEN", index: i, value: str[i++] });
            continue;
        }
        if (char === "}") {
            tokens.push({ type: "CLOSE", index: i, value: str[i++] });
            continue;
        }
        if (char === ":") {
            var name = "";
            var j = i + 1;
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name)
                throw new TypeError("Missing parameter name at ".concat(i));
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at ".concat(j));
                    }
                }
                pattern += str[j++];
            }
            if (count)
                throw new TypeError("Unbalanced pattern at ".concat(i));
            if (!pattern)
                throw new TypeError("Missing pattern at ".concat(i));
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
    };
    var consumeText = function () {
        var result = "";
        var value;
        while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
            result += value;
        }
        return result;
    };
    while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || "",
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
/**
 * Compile a string to a template function for the path.
 */
function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
}
/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens, options) {
    if (options === void 0) { options = {}; }
    var reFlags = flags(options);
    var _a = options.encode, encode = _a === void 0 ? function (x) { return x; } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
    // Compile all the tokens into regexps.
    var matches = tokens.map(function (token) {
        if (typeof token === "object") {
            return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
        }
    });
    return function (data) {
        var path = "";
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (typeof token === "string") {
                path += token;
                continue;
            }
            var value = data ? data[token.name] : undefined;
            var optional = token.modifier === "?" || token.modifier === "*";
            var repeat = token.modifier === "*" || token.modifier === "+";
            if (Array.isArray(value)) {
                if (!repeat) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to not repeat, but got an array"));
                }
                if (value.length === 0) {
                    if (optional)
                        continue;
                    throw new TypeError("Expected \"".concat(token.name, "\" to not be empty"));
                }
                for (var j = 0; j < value.length; j++) {
                    var segment = encode(value[j], token);
                    if (validate && !matches[i].test(segment)) {
                        throw new TypeError("Expected all \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                    }
                    path += token.prefix + segment + token.suffix;
                }
                continue;
            }
            if (typeof value === "string" || typeof value === "number") {
                var segment = encode(String(value), token);
                if (validate && !matches[i].test(segment)) {
                    throw new TypeError("Expected \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
                }
                path += token.prefix + segment + token.suffix;
                continue;
            }
            if (optional)
                continue;
            var typeOfMessage = repeat ? "an array" : "a string";
            throw new TypeError("Expected \"".concat(token.name, "\" to be ").concat(typeOfMessage));
        }
        return path;
    };
}
/**
 * Escape a regular expression string.
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */
function flags(options) {
    return options && options.sensitive ? "" : "i";
}

function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return toPath;
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware(_, next) {
      return next();
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    clientDirectives,
    routes
  };
}

const manifest = deserializeManifest({"adapterName":"@astrojs/vercel/serverless","routes":[{"file":"hubhealth/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/hubhealth","isIndex":false,"type":"page","pattern":"^\\/hubhealth\\/?$","segments":[[{"content":"hubhealth","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/hubhealth.astro","pathname":"/hubhealth","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"nosotros/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/nosotros","isIndex":false,"type":"page","pattern":"^\\/nosotros\\/?$","segments":[[{"content":"nosotros","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/nosotros.astro","pathname":"/nosotros","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"noticias/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/noticias","isIndex":false,"type":"page","pattern":"^\\/noticias\\/?$","segments":[[{"content":"noticias","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/noticias.astro","pathname":"/noticias","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"sobre-clusters/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/sobre-clusters","isIndex":false,"type":"page","pattern":"^\\/sobre-clusters\\/?$","segments":[[{"content":"sobre-clusters","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/sobre-clusters.astro","pathname":"/sobre-clusters","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.CcLm-rRg.js"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@4.4.0_typescript@5.3.2/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/hoisted.B6HML8aS.js"},{"type":"external","value":"/_astro/page.CcLm-rRg.js"}],"styles":[{"type":"external","src":"/_astro/contacto.6eXtlsaw.css"},{"type":"external","src":"/_astro/contacto.wdTljQeR.css"},{"type":"inline","content":".page-content>h2,.page-content>h4{margin-bottom:1.25rem}.page-content>p{margin-bottom:1.5rem}.page-content>ol{margin-bottom:1.5rem;list-style-position:inside;list-style-type:decimal}.page-content>ol>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.625rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.625rem * var(--tw-space-y-reverse))}.page-content>ol{font-size:.875rem;line-height:1.25rem}\ninput[data-astro-cid-2mxdoeuz],textarea[data-astro-cid-2mxdoeuz]{margin-bottom:1.75rem;width:100%;border-width:1px;border-style:solid;--tw-border-opacity: 1;border-color:rgb(212 212 216 / var(--tw-border-opacity));--tw-bg-opacity: 1;background-color:rgb(255 255 255 / var(--tw-bg-opacity));padding:1rem .75rem;font-size:.875rem;line-height:1.25rem;font-weight:500;--tw-text-opacity: 1;color:rgb(63 63 70 / var(--tw-text-opacity))}\n"}],"routeData":{"route":"/contacto","isIndex":false,"type":"page","pattern":"^\\/contacto\\/?$","segments":[[{"content":"contacto","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/contacto.astro","pathname":"/contacto","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/home/ldore/projects/cluster-salud-sd/src/pages/contacto.astro",{"propagation":"none","containsHead":true}],["/home/ldore/projects/cluster-salud-sd/src/pages/hubhealth.astro",{"propagation":"none","containsHead":true}],["/home/ldore/projects/cluster-salud-sd/src/pages/nosotros.astro",{"propagation":"none","containsHead":true}],["/home/ldore/projects/cluster-salud-sd/src/pages/sobre-clusters.astro",{"propagation":"none","containsHead":true}],["/home/ldore/projects/cluster-salud-sd/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["/home/ldore/projects/cluster-salud-sd/src/pages/noticias.astro",{"propagation":"none","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var i=t=>{let e=async()=>{await(await t())()};\"requestIdleCallback\"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","/node_modules/.pnpm/astro@4.4.0_typescript@5.3.2/node_modules/astro/dist/assets/endpoint/generic.js":"chunks/pages/generic_VmvQOKWO.mjs","\u0000@astrojs-manifest":"manifest_BP9yUWba.mjs","\u0000@astro-page:node_modules/.pnpm/astro@4.4.0_typescript@5.3.2/node_modules/astro/dist/assets/endpoint/generic@_@js":"chunks/generic_ButET_Al.mjs","\u0000@astro-page:src/pages/contacto@_@astro":"chunks/contacto_BIfzpnlr.mjs","\u0000@astro-page:src/pages/hubhealth@_@astro":"chunks/hubhealth_pq4KZHoJ.mjs","\u0000@astro-page:src/pages/nosotros@_@astro":"chunks/nosotros_6ePzKHUa.mjs","\u0000@astro-page:src/pages/noticias@_@astro":"chunks/noticias_4qnOc0mj.mjs","\u0000@astro-page:src/pages/sobre-clusters@_@astro":"chunks/sobre-clusters_BPt8c9hm.mjs","\u0000@astro-page:src/pages/index@_@astro":"chunks/index_CoeJrbaW.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/actividad-mepyd-camara-comercio.md?astroContentCollectionEntry=true":"chunks/actividad-mepyd-camara-comercio_BdyHbnCn.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-analiza-innovacion-y-tecnologia.md?astroContentCollectionEntry=true":"chunks/cluster-de-salud-analiza-innovacion-y-tecnologia_Bdq24W1x.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-apuesta-a-calidad.md?astroContentCollectionEntry=true":"chunks/cluster-de-salud-apuesta-a-calidad_CVoD7pKY.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster.md?astroContentCollectionEntry=true":"chunks/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster_DpsH9XbS.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/hubhealth19.md?astroContentCollectionEntry=true":"chunks/hubhealth19_Y7J60_CZ.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud.md?astroContentCollectionEntry=true":"chunks/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud_CA7fgfVm.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo.md?astroContentCollectionEntry=true":"chunks/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo_CZP7Cih0.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo.md?astroContentCollectionEntry=true":"chunks/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo_B7PNLtBW.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/actividad-mepyd-camara-comercio.md?astroPropagatedAssets":"chunks/actividad-mepyd-camara-comercio_DA14ClrJ.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-analiza-innovacion-y-tecnologia.md?astroPropagatedAssets":"chunks/cluster-de-salud-analiza-innovacion-y-tecnologia_DUwGFYRX.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-apuesta-a-calidad.md?astroPropagatedAssets":"chunks/cluster-de-salud-apuesta-a-calidad_D-Q3BDAF.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster.md?astroPropagatedAssets":"chunks/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster_C98c7lQM.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/hubhealth19.md?astroPropagatedAssets":"chunks/hubhealth19_CEFYB8T8.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud.md?astroPropagatedAssets":"chunks/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud_Dkh4EH0q.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo.md?astroPropagatedAssets":"chunks/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo_DbRx5f3O.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo.md?astroPropagatedAssets":"chunks/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo_C_uckCsB.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/actividad-mepyd-camara-comercio.md":"chunks/actividad-mepyd-camara-comercio_BJM4wduk.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-analiza-innovacion-y-tecnologia.md":"chunks/cluster-de-salud-analiza-innovacion-y-tecnologia_Ce0hOedn.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-apuesta-a-calidad.md":"chunks/cluster-de-salud-apuesta-a-calidad_DC5CJgQs.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster.md":"chunks/cluster-de-salud-de-santo-domingo-realiza-premiacion-campeon-del-cluster_CL42jDi7.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/hubhealth19.md":"chunks/hubhealth19_LkYBko19.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud.md":"chunks/resaltan-voluntad-politica-para-desarrollar-turismo-de-salud_9xvFiOxI.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo.md":"chunks/se-conforma-3era-edicion-del-foro-hubhealth-del-cluster-de-salud-de-santo-domingo_7gddTP8L.mjs","/home/ldore/projects/cluster-salud-sd/src/content/noticias/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo.md":"chunks/sugieren-plan-mancomunado-para-mejorar-oferta-de-turismo-de-salud-en-santo-domingo_DM4Ue6W6.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.B6HML8aS.js","/astro/hoisted.js?q=1":"_astro/hoisted.mszscazt.js","astro:scripts/page.js":"_astro/page.CcLm-rRg.js","astro:scripts/before-hydration.js":""},"assets":["/_astro/hubhealth.BpDa-mP4.jpg","/_astro/asonahores-logo.AoqPn3dF.png","/_astro/ISQua_Final_Logo_landscape2.BLZb0YhI.png","/_astro/ClusterSaludSD.DKjimtHF.jpg","/_astro/ibms-logo.BXSTfS9J.png","/_astro/Shutterfly_Share_19.C_FWj1xe.jpg","/_astro/cssd-banner.Bfnvbdjk.jpg","/_astro/icon-capacitacion.IkLZfkao.png","/_astro/icon-nosotros.CjUzhnP3.png","/_astro/icon-clusters.BxeiSphW.png","/_astro/san-nicolas-bari.BGLDnu94.jpg","/_astro/bandera-dominicana.BV33IhIs.jpg","/_astro/raleway-cyrillic-ext-wght-normal.SEE3ffVV.woff2","/_astro/raleway-cyrillic-wght-normal.BQKbr57L.woff2","/_astro/raleway-latin-ext-wght-normal.Zvxqu6qX.woff2","/_astro/raleway-latin-wght-normal.QfmocS7j.woff2","/_astro/raleway-vietnamese-wght-normal.W5ufM8XN.woff2","/_astro/lora-cyrillic-ext-wght-italic.NuLCXviy.woff2","/_astro/lora-cyrillic-wght-italic.BAo16D9x.woff2","/_astro/lora-symbols-wght-italic.CfIDz-pa.woff2","/_astro/lora-vietnamese-wght-italic.DHby224n.woff2","/_astro/lora-math-wght-italic.15do21h3.woff2","/_astro/lora-latin-ext-wght-italic.BoQ6-C7H.woff2","/_astro/lora-latin-wght-italic.D6DweUWN.woff2","/_astro/logo.Ijou4OXp.jpg","/_astro/contacto.6eXtlsaw.css","/_astro/contacto.wdTljQeR.css","/ClusterSaludSD.org.pdf","/HUBHEALTH19_FULL.pdf","/favicon.svg","/_astro/hoisted.B6HML8aS.js","/_astro/hoisted.mszscazt.js","/_astro/page.CcLm-rRg.js","/images/noticias/1.jpg","/images/noticias/Amado_Baez.jpg","/images/noticias/ClusterSaludSD.jpg","/images/noticias/IBMS_UNPHU.jpg","/images/noticias/campeon1.jpg","/images/noticias/foto_modelo.jpg","/images/noticias/hubhealth.jpg","/images/noticias/mitur.jpg","/_astro/page.CcLm-rRg.js","/hubhealth/index.html","/nosotros/index.html","/noticias/index.html","/sobre-clusters/index.html","/index.html"],"buildFormat":"directory"});

export { AstroIntegrationLogger as A, Logger as L, getEventPrefix as g, levels as l, manifest };
