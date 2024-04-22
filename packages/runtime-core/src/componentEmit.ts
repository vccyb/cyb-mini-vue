export function emit(instance, event, ...args) {
  const { props } = instance;
  console.log("emit", event);

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const toHandlerKey = (str: string) => {
    return str ? "on" + capitalize(str) : "";
  };

  const handlerKey = toHandlerKey(event);
  const handler = props[handlerKey];
  handler && handler(...args);
}
