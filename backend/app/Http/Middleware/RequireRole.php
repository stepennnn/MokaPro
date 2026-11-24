<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    /**
     * @param  array<int, string>  $roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $activeRole = $request->session()->get('active_role');
        $user = $request->user();

        abort_unless(
            $user instanceof User
            && is_string($activeRole)
            && $user->hasRole($activeRole)
            && in_array($activeRole, $roles, true),
            403,
        );

        return $next($request);
    }
}
