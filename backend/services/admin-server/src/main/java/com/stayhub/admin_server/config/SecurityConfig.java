package com.stayhub.admin_server.config;

import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AdminServerProperties adminServer;

    public SecurityConfig(AdminServerProperties adminServer) {
        this.adminServer = adminServer;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        SavedRequestAwareAuthenticationSuccessHandler successHandler = 
            new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(this.adminServer.getContextPath() + "/");

        http.authorizeHttpRequests(authz -> authz
                .requestMatchers(this.adminServer.getContextPath() + "/assets/**").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/login").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/actuator/health").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/actuator/health/**").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/actuator/info").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/instances").permitAll()
                .requestMatchers(this.adminServer.getContextPath() + "/instances/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage(this.adminServer.getContextPath() + "/login")
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl(this.adminServer.getContextPath() + "/logout")
            )
            .httpBasic()
            .and()
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers(
                    this.adminServer.getContextPath() + "/instances",
                    this.adminServer.getContextPath() + "/instances/**",
                    this.adminServer.getContextPath() + "/actuator/**"
                )
            );

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.builder()
                .username("admin")
                .password(passwordEncoder().encode("admin123"))
                .roles("ADMIN")
                .build(),
            User.builder()
                .username("ops")
                .password(passwordEncoder().encode("ops123"))
                .roles("USER")
                .build()
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}