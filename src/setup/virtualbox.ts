const virtualbox = require("virtualbox");
let default_machine_folder: string;
virtualbox.vboxmanage(
  ["list", "systemproperties"],
  (_err: Error, system_properties: string) => {
    console.log(system_properties);
    for (let line of system_properties.split("\n")) {
      if (line.includes("Default machine folder:")) {
        default_machine_folder = line.split("folder:")[1].trim();
        break;
      }
    }
  }
);

export { virtualbox, default_machine_folder };
