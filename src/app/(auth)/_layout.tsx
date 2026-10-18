import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: "Iniciar sesión",
        }}
      />

      <Stack.Screen
        name="registro"
        options={{
          title: "Crear cuenta",
        }}
      />
    </Stack>
  );
}