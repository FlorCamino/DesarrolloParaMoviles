import { Stack } from 'expo-router';

export default function PanelLayout() {
    return (
        <Stack screenOptions={{headerShown: true, headerTintColor: '#2455B8'}}>
            <Stack.Screen name="index" options={{title: 'Panel de mi comercio'}} />
            <Stack.Screen name="promociones" options={{title: 'Mis promociones'}} />
            <Stack.Screen name="promocion_formulario" options={{title: 'Promocion'}} />
            <Stack.Screen name="validar_codigo" options={{title:'Validar código'}} />
            <Stack.Screen name="mi_comercio" options={{title: "Mi comercio"}} />
            <Stack.Screen name="horarios" options={{title: "Horarios"}} />
            <Stack.Screen name="resenas" options={{title: "Reseñas"}} />
        </Stack>
    );
}