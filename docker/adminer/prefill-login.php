<?php

/**
 * Prefills the Adminer login form from the ADMINER_DEFAULT_* environment
 * variables (driver, db, username, password). The official image only
 * honours ADMINER_DEFAULT_SERVER; this plugin covers the rest.
 * Local development only — the password ends up in the served HTML.
 */
class PrefillLogin extends Adminer\Plugin {
	function loginFormField($name, $heading, $value) {
		if ($name == 'driver') {
			$driver = getenv('ADMINER_DEFAULT_DRIVER');
			if ($driver) {
				return '<input type="hidden" name="auth[driver]" value="' . Adminer\h($driver) . '">' . "\n";
			}
			return null;
		}
		$env = getenv('ADMINER_DEFAULT_' . strtoupper($name == 'db' ? 'db' : $name));
		if ($env === false || $env === '') {
			return null;
		}
		$type = $name == 'password' ? 'password' : 'text';
		return $heading . '<input type="' . $type . '" name="auth[' . $name . ']" value="' . Adminer\h($env) . '" autocapitalize="off">' . "\n";
	}
}

return new PrefillLogin();
