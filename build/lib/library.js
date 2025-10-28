"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var library_exports = {};
__export(library_exports, {
  BaseClass: () => BaseClass,
  Library: () => Library,
  sleep: () => sleep
});
module.exports = __toCommonJS(library_exports);
var import_jsonata = __toESM(require("jsonata"));
var import_fs = __toESM(require("fs"));
var import_definition = require("./def/definition");
class BaseClass {
  unload = false;
  log;
  adapter;
  library;
  name = ``;
  /**
   * Create a new instance of the BaseClass.
   *
   * @param adapter The adapter instance.
   * @param name The name of the instance, used for logging.
   */
  constructor(adapter, name = "") {
    this.name = name;
    this.log = new CustomLog(adapter, this.name);
    this.adapter = adapter;
    this.library = adapter.library;
  }
  async delete() {
    this.unload = true;
  }
}
class CustomLog {
  adapter;
  prefix;
  /**
   * Create a new instance of the CustomLog class.
   *
   * @param adapter The adapter instance.
   * @param text The prefix for the log messages.
   */
  constructor(adapter, text = "") {
    this.adapter = adapter;
    this.prefix = text;
  }
  /**
   * Return the prefix string used for log messages.
   *
   * @returns The prefix string.
   */
  getName() {
    return this.prefix;
  }
  /**
   * Writes a debug message to the log.
   *
   * @param log The debug message.
   * @param log2 An additional debug message.
   */
  debug(log, log2 = "") {
    this.adapter.log.debug(log2 ? `[${log}] ${log2}` : `[${this.prefix}] ${log}`);
  }
  info(message, additionalMessage = "") {
    const formattedMessage = additionalMessage ? `[${message}] ${additionalMessage}` : `[${this.prefix}] ${message}`;
    this.adapter.log.info(formattedMessage);
  }
  /**
   * Writes a warning message to the log.
   *
   * @param message The warning message.
   * @param additionalMessage An additional warning message.
   */
  warn(message, additionalMessage = "") {
    const formattedMessage = additionalMessage ? `[${message}] ${additionalMessage}` : `[${this.prefix}] ${message}`;
    this.adapter.log.warn(formattedMessage);
  }
  /**
   * Writes an error message to the log.
   *
   * @param errorMessage The error message.
   * @param additionalErrorMessage An additional error message.
   */
  error(errorMessage, additionalErrorMessage = "") {
    const formattedErrorMessage = additionalErrorMessage ? `[${errorMessage}] ${additionalErrorMessage}` : `[${this.prefix}] ${errorMessage}`;
    this.adapter.log.error(formattedErrorMessage);
  }
  /**
   * Sets the prefix for log messages.
   *
   * @param prefix - The prefix to be used for log messages. Leading and trailing whitespace are trimmed.
   */
  setLogPrefix(prefix) {
    this.prefix = prefix.trim();
  }
}
class Library extends BaseClass {
  stateDataBase = {};
  language = "en";
  forbiddenDirs = [];
  translation = {};
  /**
   * Creates a new instance of the Library class.
   *
   * @param adapter The adapter instance.
   * @param _options The configuration options for the adapter. Not used.
   */
  constructor(adapter, _options = null) {
    super(adapter, "library");
    this.stateDataBase = {};
  }
  /**
   * Initializes the Library by setting the language based on the system configuration.
   * If the system configuration's language is not available, defaults to English.
   *
   * @returns A promise that resolves when initialization is complete.
   */
  async init() {
    const obj = await this.adapter.getForeignObjectAsync("system.config");
    if (obj) {
      await this.setLanguage(obj.common.language, true);
    } else {
      await this.setLanguage("en", true);
    }
  }
  /**
   * Write/create from a Json with defined keys, the associated states and channels
   *
   * @param prefix iobroker datapoint prefix where to write
   * @param objNode Entry point into the definition json.
   * @param def the definition json
   * @param data The Json to read
   * @param expandTree expand arrays up to 99
   * @returns  void
   */
  async writeFromJson(prefix, objNode, def, data, expandTree = false) {
    if (!def || typeof def !== "object") {
      return;
    }
    if (data === void 0 || ["string", "number", "boolean", "object"].indexOf(typeof data) == -1) {
      return;
    }
    const objectDefinition = objNode ? this.getObjectDefFromJson(`${objNode}`, def) : null;
    if (objectDefinition) {
      objectDefinition.native = {
        ...objectDefinition.native || {},
        objectDefinitionReference: objNode
      };
    }
    if (typeof data === "object" && data !== null) {
      if (Array.isArray(data)) {
        if (!objectDefinition) {
          return;
        }
        if (this.adapter.config.expandArray || objectDefinition.type !== "state" || expandTree) {
          let a = 0;
          for (const k of data) {
            const defChannel = this.getChannelObject(objectDefinition);
            const dp = `${prefix}${`00${a++}`.slice(-2)}`;
            await this.writedp(dp, null, defChannel);
            await this.writeFromJson(dp, `${objNode}`, def, k, expandTree);
          }
        } else {
          await this.writeFromJson(prefix, objNode, def, JSON.stringify(data) || "[]", expandTree);
        }
      } else {
        if (objectDefinition) {
          const defChannel = this.getChannelObject(objectDefinition);
          await this.writedp(prefix, null, defChannel);
        }
        if (data === null) {
          return;
        }
        for (const k in data) {
          await this.writeFromJson(`${prefix}.${k}`, `${objNode}.${k}`, def, data[k], expandTree);
        }
      }
    } else {
      if (!objectDefinition) {
        return;
      }
      await this.writedp(prefix, data, objectDefinition);
    }
  }
  /**
   * Get the ioBroker.Object out of stateDefinition
   *
   * @param key is the deep linking key to the definition
   * @param data  is the definition dataset
   * @returns ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject
   */
  getObjectDefFromJson(key, data) {
    let result = this.deepJsonValue(key, data);
    if (result === null || result === void 0) {
      const k = key.split(".");
      if (k && k[k.length - 1].startsWith("_")) {
        result = import_definition.genericStateObjects.customString;
      } else {
        this.log.warn(`No definition for ${key}!`);
        result = import_definition.genericStateObjects.state;
      }
    }
    return this.cloneObject(result);
  }
  /**
   * Retrieve a value from a nested object.
   *
   * @param key string of dot-separated keys to traverse the object.
   * @param data The object to traverse.
   * @returns The value at the key. If the key does not exist, throws an error.
   */
  deepJsonValue(key, data) {
    if (!key || !data || typeof data !== "object" || typeof key !== "string") {
      throw new Error(`Error(222) data or key are missing/wrong type!`);
    }
    const k = key.split(`.`);
    let c = 0, s = data;
    while (c < k.length) {
      s = s[k[c++]];
    }
    return s;
  }
  /**
   * Create a ioBroker.ChannelObject or ioBroker.DeviceObject out of a
   * ioBroker.Object definition.
   *
   * @param definition the ioBroker.Object definition
   * @returns ioBroker.ChannelObject | ioBroker.DeviceObject
   */
  getChannelObject(definition = null) {
    const def = definition && definition._channel || null;
    const result = {
      _id: def ? def._id : "",
      type: def && def.type != "device" ? "channel" : "device",
      common: {
        name: def && def.common && def.common.name || "no definition"
      },
      native: def && def.native || {}
    };
    return result;
  }
  /**
   * Write/Create the specified data point with value, will only be written if val != oldval and obj.type == state or the data point value in the DB is not undefined. Channel and Devices have an undefined value.
   *
   * @param dp Data point to be written. Library.clean() is called with it.
   * @param val Value for this data point. Channel vals (old and new) are undefined so they never will be written.
   * @param obj The object definition for this data point (ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.StateObject)
   * @returns void
   */
  async writedp(dp, val, obj = null) {
    dp = this.cleandp(dp);
    let node = this.readdp(dp);
    const del = !this.isDirAllowed(dp);
    if (node === void 0) {
      if (!obj) {
        throw new Error("writedp try to create a state without object informations.");
      }
      obj._id = `${this.adapter.name}.${this.adapter.instance}.${dp}`;
      if (typeof obj.common.name == "string") {
        obj.common.name = await this.getTranslationObj(obj.common.name);
      }
      if (!del) {
        await this.adapter.extendObjectAsync(dp, obj);
      }
      const stateType = obj && obj.common && obj.common.type;
      node = this.setdb(dp, obj.type, void 0, stateType, true);
    } else if (node.init && obj) {
      if (typeof obj.common.name == "string") {
        obj.common.name = await this.getTranslationObj(obj.common.name);
      }
      if (!del) {
        await this.adapter.extendObjectAsync(dp, obj);
      }
    }
    if (obj && obj.type !== "state") {
      return;
    }
    if (node) {
      this.setdb(dp, node.type, val, node.stateTyp, true);
    }
    if (node && (node.val != val || !node.ack)) {
      const typ = obj && obj.common && obj.common.type || node.stateTyp;
      if (typ && typ != typeof val && val !== void 0) {
        val = this.convertToType(val, typ);
      }
      if (!del) {
        await this.adapter.setStateAsync(dp, {
          val,
          ts: Date.now(),
          ack: true
        });
      }
    }
  }
  /**
   * Concatenates the given array of forbidden directory patterns with the current array of patterns.
   * The given array elements are strings which are used to create a regular expression, so special characters should be escaped.
   *
   * @param dirs Array of strings which are used to create a regular expression to check if a directory is allowed.
   */
  setForbiddenDirs(dirs) {
    this.forbiddenDirs = this.forbiddenDirs.concat(dirs);
  }
  /**
   * Checks if the given directory path is allowed to be used.
   * The rules are as follows:
   * - The path must not contain any of the strings from the `forbiddenDirs` array.
   * - The path must not consist of more than 2 parts (i.e. it must not contain any dots).
   *
   * @param dp The directory path to check.
   * @returns true if the directory path is allowed, false otherwise.
   */
  isDirAllowed(dp) {
    if (dp && dp.split(".").length <= 2) {
      return true;
    }
    for (const a of this.forbiddenDirs) {
      if (dp.search(new RegExp(a, "g")) != -1) {
        return false;
      }
    }
    return true;
  }
  /**
   * Get all states that match the given string.
   * The string is used as a regular expression to filter the state paths.
   * The result is an object where the keys are the state paths and the values are the state values.
   *
   * @param str The string to filter the states with.
   * @returns An object with the state paths as keys and the state values as values.
   */
  getStates(str) {
    const result = {};
    for (const dp in this.stateDataBase) {
      if (dp.search(new RegExp(str, "g")) != -1) {
        result[dp] = this.stateDataBase[dp];
      }
    }
    return result;
  }
  /**
   * Clean up the state data base by deleting all states that do not have a hold object in the given array
   * and do not match any of the given filter strings.
   * Additionally, the given deep parameter is used to slice the state path and delete the resulting object
   * from the adapter object list.
   *
   * @param hold An array of strings which are used to determine if a state should be kept or deleted.
   * @param filter An array of strings which are used to filter the states to be deleted. If a state's path
   * starts with any of the strings in this array, it will not be deleted.
   * @param deep The number of path parts to slice from the state path to delete from the adapter object list.
   * @returns A promise that resolves when all states have been deleted.
   */
  async cleanUpTree(hold, filter, deep) {
    let del = [];
    for (const dp in this.stateDataBase) {
      if (filter && filter.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length == 0) {
        continue;
      }
      if (hold.filter((a) => dp.startsWith(a) || a.startsWith(dp)).length > 0) {
        continue;
      }
      delete this.stateDataBase[dp];
      del.push(dp.split(".").slice(0, deep).join("."));
    }
    del = del.filter((item, pos, arr) => {
      return arr.indexOf(item) == pos;
    });
    for (const a of del) {
      await this.adapter.delObjectAsync(a, { recursive: true });
      this.log.debug(`Clean up tree delete: ${a}`);
    }
  }
  /**
   * Cleans a given string by replacing forbidden characters with underscores.
   *
   * @param string - The input string to be cleaned.
   * @param lowerCase - If true, converts the string to lowercase after cleaning.
   * @param removePoints - If true, removes all non-alphanumeric characters except underscores and hyphens.
   *                       If false, retains periods as valid characters.
   * @returns The cleaned string with forbidden characters replaced and optionally converted to lowercase.
   */
  cleandp(string, lowerCase = false, removePoints = false) {
    if (!string && typeof string != "string") {
      return string;
    }
    string = string.replace(this.adapter.FORBIDDEN_CHARS, "_");
    if (removePoints) {
      string = string.replace(/[^0-9A-Za-z_-]/gu, "_");
    } else {
      string = string.replace(/[^0-9A-Za-z._-]/gu, "_");
    }
    return lowerCase ? string.toLowerCase() : string;
  }
  /**
   * Convert a value to the given type
   *
   * @param value then value to convert
   * @param type the target type
   */
  convertToType(value, type) {
    if (value === null) {
      return null;
    }
    if (type === void 0) {
      throw new Error("convertToType type undefined not allowed!");
    }
    if (value === void 0) {
      value = "";
    }
    const old_type = typeof value;
    let newValue = typeof value == "object" ? JSON.stringify(value) : value;
    if (type !== old_type) {
      switch (type) {
        case "string":
          newValue = value.toString() || "";
          break;
        case "number":
          newValue = value ? Number(value) : 0;
          break;
        case "boolean":
          newValue = !!value;
          break;
        case "array":
        case "json":
          break;
      }
    }
    return newValue;
  }
  /**
   * reads a datapoint from the state database
   *
   * @param dp the datapointname
   * @returns the data of the datapoint
   */
  readdp(dp) {
    return this.stateDataBase[this.cleandp(dp)];
  }
  /**
   * Stores a datapoint in the state database
   *
   * @param dp datapoint name
   * @param type type of the datapoint
   * @param val the value
   * @param stateType the state type
   * @param [ack] ack flag
   * @param [ts] timestamp
   * @param [init] init flag
   * @returns the new state
   */
  setdb(dp, type, val, stateType, ack = true, ts = Date.now(), init = false) {
    this.stateDataBase[dp] = {
      type,
      stateTyp: stateType !== void 0 ? stateType : this.stateDataBase[dp] !== void 0 && this.stateDataBase[dp].stateTyp !== void 0 ? this.stateDataBase[dp].stateTyp : void 0,
      val,
      ack,
      ts: ts ? ts : Date.now(),
      init
    };
    return this.stateDataBase[dp];
  }
  /**
   * Delete all objects in data array
   *
   * @param data array of ioBroker objects
   * @returns Promise that resolves when all objects are deleted
   */
  async memberDeleteAsync(data) {
    for (const d of data) {
      await d.delete();
    }
  }
  /**
   * Clones a ioBroker object.
   *
   * @param obj the object to clone
   * @returns the cloned object
   * @throws {Error} if target is not an object
   */
  cloneObject(obj) {
    if (typeof obj !== "object") {
      this.log.error(`Error clone object target is type: ${typeof obj}`);
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  /**
   * Deep clones a generic object.
   *
   * @param obj the object to clone
   * @returns the cloned object
   */
  cloneGenericObject(obj) {
    if (typeof obj !== "object") {
      this.log.error(`Error clone object target is type: ${typeof obj}`);
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  }
  /**
   * Checks if a file exists in the './admin/' directory.
   *
   * @param file - The name of the file to check.
   * @returns True if the file exists, otherwise false.
   */
  fileExistAsync(file) {
    if (import_fs.default.existsSync(`./admin/${file}`)) {
      return true;
    }
    return false;
  }
  /**
   * Evaluate a jsonata command on given data.
   *
   * @param data The data which is used to evaluate the jsonata command.
   * @param cmd The jsonata command or an object with multiple commands.
   * @returns The result of the jsonata command. If the command is invalid or
   * the jsonata command returns undefined, an empty string is returned. If
   * an object with multiple commands is given, the result is an object with
   * the same keys as the input object, but with the results of the jsonata
   * commands as values. If an error occurs during evaluation, an error is
   * logged and an empty string is returned for the corresponding key.
   */
  /**
   * Evaluates a jsonata command on given data.
   *
   * @param data The data which is used to evaluate the jsonata command.
   * @param cmd The jsonata command or an object with multiple commands.
   * @returns The result of the jsonata command. If the command is invalid or
   * the jsonata command returns undefined, an empty string is returned. If
   * an object with multiple commands is given, the result is an object with
   * the same keys as the input object, but with the results of the jsonata
   * commands as values. If an error occurs during evaluation, an error is
   * logged and an empty string is returned for the corresponding key.
   */
  async readWithJsonata(data, cmd) {
    let result;
    if (typeof cmd === "string") {
      if (cmd == "") {
        return "";
      }
      try {
        result = await (0, import_jsonata.default)(cmd).evaluate(data);
        if (result == void 0) {
          return "";
        }
      } catch (error) {
        this.log.error(error.message);
        this.log.error(`The cmd: ${cmd} is invaild Message: ${error.message}.`);
      }
    } else {
      result = {};
      for (const k in cmd) {
        if (cmd[k]) {
          try {
            result[k] = await (0, import_jsonata.default)(cmd[k]).evaluate(data);
          } catch (error) {
            this.log.error(error);
            this.log.error(`The cmd: ${cmd[k]} for key ${k} is invaild.`);
          }
        }
      }
    }
    return result;
  }
  /**
   * Initialise the database with the states to prevent unnecessary creation and writing.
   *
   * @param states States that are to be read into the database during initialisation.
   * @returns void
   */
  async initStates(states) {
    if (!states) {
      return;
    }
    const removedChannels = [];
    for (const state in states) {
      const dp = state.replace(`${this.adapter.name}.${this.adapter.instance}.`, "");
      const del = !this.isDirAllowed(dp);
      if (!del) {
        const obj = await this.adapter.getObjectAsync(dp);
        if (!this.adapter.config.useJsonHistory && dp.endsWith(".warning.jsonHistory")) {
          this.log.debug(`delete state: ${dp}`);
          await this.adapter.delObjectAsync(dp);
          continue;
        }
        this.setdb(
          dp,
          "state",
          states[state] && states[state].val ? states[state].val : void 0,
          obj && obj.common && obj.common.type ? obj.common.type : void 0,
          states[state] && states[state].ack,
          states[state] && states[state].ts ? states[state].ts : Date.now(),
          true
        );
      } else {
        if (!removedChannels.every((a) => !dp.startsWith(a))) {
          continue;
        }
        const channel = dp.split(".").slice(0, 4).join(".");
        removedChannels.push(channel);
        await this.adapter.delObjectAsync(channel, { recursive: true });
        this.log.debug(`Delete channel with dp:${channel}`);
      }
    }
  }
  /**
   * Resets states that have not been updated in the database in offset time.
   *
   * @param prefix String with which states begin that are reset.
   * @param offset Time in ms since last update.
   * @returns void
   */
  async garbageColleting(prefix, offset = 2e3) {
    if (!prefix) {
      return;
    }
    if (this.stateDataBase) {
      for (const id in this.stateDataBase) {
        if (id.startsWith(prefix)) {
          const state = this.stateDataBase[id];
          if (!state || state.val == void 0) {
            continue;
          }
          if (state.ts < Date.now() - offset) {
            let newVal;
            switch (state.stateTyp) {
              case "string":
                if (typeof state.val == "string") {
                  if (state.val.startsWith("{") && state.val.endsWith("}")) {
                    newVal = "{}";
                  } else if (state.val.startsWith("[") && state.val.endsWith("]")) {
                    newVal = "[]";
                  } else {
                    newVal = "";
                  }
                } else {
                  newVal = "";
                }
                break;
              case "bigint":
              case "number":
                newVal = -1;
                break;
              case "boolean":
                newVal = false;
                break;
              case "symbol":
              case "object":
              case "function":
                newVal = null;
                break;
              case "undefined":
                newVal = void 0;
                break;
            }
            await this.writedp(id, newVal);
          }
        }
      }
    }
  }
  /**
   * Get the local language as a string
   * The language is determined from the admin settings and is 'en-En' if no language is set
   *
   * @returns The local language as a string
   */
  getLocalLanguage() {
    if (this.language) {
      return this.language;
    }
    return "en-En";
  }
  /**
   * Return the translation of the given key
   * If no translation is found the key itself is returned
   *
   * @param key The key to translate
   * @returns The translated string
   */
  getTranslation(key) {
    if (this.translation[key] !== void 0) {
      return this.translation[key];
    }
    return key;
  }
  /**
   * Checks if a translation exists for the given key.
   *
   * @param key The key to check for translation.
   * @returns True if the translation exists, otherwise false.
   */
  existTranslation(key) {
    return this.translation[key] !== void 0;
  }
  /**
   * Return the translation of the given key for all languages
   * If no translation is found the key itself is returned
   *
   * @param key The key to translate
   * @returns The translated string or a object with the translations for all languages
   */
  async getTranslationObj(key) {
    const language = [
      "en",
      "de",
      "ru",
      "pt",
      "nl",
      "fr",
      "it",
      "es",
      "pl",
      "uk",
      "zh-cn"
    ];
    const result = {};
    for (const l of language) {
      try {
        const i = await Promise.resolve().then(() => __toESM(require(`../../admin/i18n/${l}/translations.json`)));
        if (i[key] !== void 0) {
          result[l] = i[key];
        }
      } catch {
        return key;
      }
    }
    if (result.en == void 0) {
      return key;
    }
    return result;
  }
  /**
   * Sets the language for all getTranslation and getTranslationObj calls.
   * If the language does not exist, it will not be changed and an error message will be logged.
   * If force is true, the language will be changed even if it is already set.
   *
   * @param language The language to set.
   * @param force Set to true to force the language to be changed.
   * @returns True if the language was changed, otherwise false.
   */
  async setLanguage(language, force = false) {
    if (!language) {
      language = "en";
    }
    if (force || this.language != language) {
      try {
        this.translation = await Promise.resolve().then(() => __toESM(require(`../../admin/i18n/${language}/translations.json`)));
        this.language = language;
        return true;
      } catch {
        this.log.error(`Language ${language} not exist!`);
      }
    }
    return false;
  }
  /**
   * Sorts an array of strings in an alphabetical order, ignoring case.
   *
   * @param text The array of strings to sort.
   * @returns The sorted array.
   */
  sortText(text) {
    text.sort((a, b) => {
      const nameA = a.toUpperCase();
      const nameB = b.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    return text;
  }
  /**
   *
   * @param text string to replace a Date
   * @param noti appendix to translation key
   * @param day true = Mo, 12.05 - false = 12.05
   * @returns Monday first March
   */
  convertSpeakDate(text, noti = "", day = false) {
    if (!text || typeof text !== `string`) {
      return ``;
    }
    const b = text.split(`.`);
    if (day) {
      b[0] = b[0].split(" ")[2];
    }
    return ` ${`${(/* @__PURE__ */ new Date(`${b[1]}/${b[0]}/${(/* @__PURE__ */ new Date()).getFullYear()}`)).toLocaleString(this.language, {
      weekday: day ? "long" : void 0,
      day: "numeric",
      month: `long`
    })} `.replace(/([0-9]+\.)/gu, (x) => {
      const result = this.getTranslation(x + noti);
      if (result != x + noti) {
        return result;
      }
      return this.getTranslation(x);
    })}`;
  }
}
async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClass,
  Library,
  sleep
});
//# sourceMappingURL=library.js.map
