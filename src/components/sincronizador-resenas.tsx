import * as Network from 'expo-network';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { sincronizarResenasPendientes } from '@/services/reviews';

export function SincronizadorResenas() {
    const { sesion, initializing } = useAuth();
    const usuarioId = sesion?.usuario.id;

    useEffect(() => {
        if (initializing || usuarioId === undefined) {
            return;
        }

        let vigente = true;
        let sincronizando = false;

        async function procesarEstado(
            conectado: boolean | undefined,
            internetDisponible: boolean | undefined,
        ) {
            const hayInternet =
                conectado === true && internetDisponible !== false;

            if (!vigente || !hayInternet || sincronizando) {
                return;
            }

            sincronizando = true;

            try {
                await sincronizarResenasPendientes();
            } catch (error) {
                if (__DEV__) {
                    console.warn(
                        'No se pudieron sincronizar las reseñas pendientes:',
                        error,
                    );
                }
            } finally {
                sincronizando = false;
            }
        }

        const suscripcion = Network.addNetworkStateListener((estado) => {
            void procesarEstado(
                estado.isConnected,
                estado.isInternetReachable,
            );
        });

        void Network.getNetworkStateAsync()
            .then((estado) =>
                procesarEstado(
                    estado.isConnected,
                    estado.isInternetReachable,
                ),
            )
            .catch((error) => {
                if (__DEV__) {
                    console.warn('No se pudo consultar la conexión:', error);
                }
            });

        return () => {
            vigente = false;
            suscripcion.remove();
        };
    }, [initializing, usuarioId]);

    return null;
}
