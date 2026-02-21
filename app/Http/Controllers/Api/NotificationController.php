<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = auth()->user()->unreadNotifications;
        return response()->json($notifications);
    }

    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function clearAll()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * SSE endpoint: streams notification updates to the client in real-time.
     * The connection stays open and pushes new data every 5 seconds.
     */
    public function stream(Request $request)
    {
        // Authenticate via query token (EventSource can't send headers)
        $token = $request->query('token');
        if (!$token) {
            return response()->json(['message' => 'Token required'], 401);
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $user = $accessToken->tokenable;

        return response()->stream(function () use ($user) {
            $lastCount = -1; // Force first push

            while (true) {
                // Check if client disconnected
                if (connection_aborted()) {
                    break;
                }

                // Refresh user model to get latest notifications
                $user->refresh();
                $unreadCount = $user->unreadNotifications()->count();

                // Only push when count changes (or first time)
                if ($unreadCount !== $lastCount) {
                    $lastCount = $unreadCount;

                    // Get latest 5 unread notifications for the popup
                    $latest = $user->unreadNotifications()
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function ($n) {
                            return [
                                'id' => $n->id,
                                'data' => $n->data,
                                'created_at' => $n->created_at->toISOString(),
                                'read_at' => $n->read_at,
                            ];
                        });

                    $payload = json_encode([
                        'unread_count' => $unreadCount,
                        'latest' => $latest,
                    ]);

                    echo "data: {$payload}\n\n";
                    ob_flush();
                    flush();
                }

                // Wait 5 seconds before next check
                sleep(5);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disable Nginx buffering
        ]);
    }
}
